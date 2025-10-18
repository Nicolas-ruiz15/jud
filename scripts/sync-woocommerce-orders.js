require('dotenv').config();

const WooCommerceService = require('../services/woocommerce');
const { query, transaction } = require('../lib/database');

class OrdersSyncManager {
  constructor() {
    this.wooService = new WooCommerceService();
    this.stats = {
      orders: { created: 0, updated: 0, skipped: 0, errors: 0 },
      orderItems: { created: 0, errors: 0 },
      customers: { created: 0, updated: 0, errors: 0 }
    };
    
    this.maxRetries = parseInt(process.env.SYNC_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.SYNC_DELAY_BETWEEN_PAGES) || 2000;
    this.batchSize = parseInt(process.env.SYNC_BATCH_SIZE) || 50;
  }

  async retryOperation(operation) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isConnectionError = error.code === 'ECONNRESET' || error.message.includes('timeout') || error.code === 'ETIMEDOUT';
        if (isConnectionError && attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`   ⚠️ Error de conexión (intento ${attempt}/${this.maxRetries}). Reintentando en ${delay/1000}s...`);
          await this.sleep(delay);
        } else {
          console.error('Database error:', error);
          throw error;
        }
      }
    }
  }
  
  async sync() {
    console.log('🛒 Iniciando sincronización de pedidos...\n');
    try {
      await this.checkConnection();
      await this.verifyOrderTables();
      console.log('📦 Sincronizando pedidos...');
      await this.syncOrdersIncremental();
      this.showStats();
    } catch (error) {
      console.error('❌ Error fatal en sincronización de pedidos:', error.message);
      this.showStats();
      throw error;
    }
  }

  async checkConnection() {
    try {
      console.log('🔍 Verificando conectividad...');
      await this.retryOperation(() => this.wooService.getOrders({ page: 1, per_page: 1 }));
      console.log('✅ Conexión con la API de WooCommerce OK');
    } catch (error) {
      throw new Error('No se pudo establecer conexión con WooCommerce después de varios intentos.');
    }
  }

  async verifyOrderTables() {
    console.log('🗃️ Verificando y actualizando tablas de pedidos...');
    try {
      // --- Columnas en la tabla 'orders' ---
      await this.addColumnIfNotExists('orders', 'woocommerce_id', 'INT UNIQUE');
      await this.addColumnIfNotExists('orders', 'currency', 'VARCHAR(10) DEFAULT "COP"');
      await this.addColumnIfNotExists('orders', 'date_created', 'DATETIME NULL');
      await this.addColumnIfNotExists('orders', 'date_modified', 'DATETIME NULL');
      await this.addColumnIfNotExists('orders', 'created_via', 'VARCHAR(100)');
      await this.addColumnIfNotExists('orders', 'woo_version', 'VARCHAR(20)');
      await this.addColumnIfNotExists('orders', 'prices_include_tax', 'BOOLEAN DEFAULT FALSE');
      await this.addColumnIfNotExists('orders', 'customer_ip_address', 'VARCHAR(100)');
      await this.addColumnIfNotExists('orders', 'customer_user_agent', 'TEXT');
      await this.addColumnIfNotExists('orders', 'date_paid', 'DATETIME NULL');
      await this.addColumnIfNotExists('orders', 'date_completed', 'DATETIME NULL');
      await this.addColumnIfNotExists('orders', 'cart_hash', 'VARCHAR(255)');
      await this.addColumnIfNotExists('orders', 'shipping_lines', 'TEXT');
      await this.addColumnIfNotExists('orders', 'coupon_lines', 'TEXT');
      await this.addColumnIfNotExists('orders', 'fee_lines', 'TEXT');
      await this.addColumnIfNotExists('orders', 'tax_lines', 'TEXT');
      await this.addColumnIfNotExists('orders', 'order_meta_data', 'TEXT');

      // --- Columnas en la tabla 'order_items' ---
      await this.addColumnIfNotExists('order_items', 'woocommerce_product_id', 'INT');
      await this.addColumnIfNotExists('order_items', 'product_name', 'VARCHAR(255)');
      await this.addColumnIfNotExists('order_items', 'product_sku', 'VARCHAR(100)');
      await this.addColumnIfNotExists('order_items', 'tax_amount', 'DECIMAL(10,2) DEFAULT 0.00');
      await this.addColumnIfNotExists('order_items', 'meta_data', 'TEXT');
      await this.addColumnIfNotExists('order_items', 'taxes_data', 'TEXT');

      console.log('✅ Tablas verificadas correctamente');
    } catch (error) {
      console.error('❌ Error verificando tablas:', error); throw error;
    }
  }

  async syncOrdersIncremental() {
    const lastSync = await this.getLastSyncDate('last_order_sync');
    // Se ignora lastSync temporalmente para forzar una resincronización completa
    console.log(`   📅 Forzando resincronización completa de TODOS los pedidos.`);
    
    let page = 1;
    while (true) {
      console.log(`   📄 Obteniendo página ${page}...`);
      
      const orders = await this.retryOperation(() => 
        this.wooService.getOrders({
          page,
          per_page: this.batchSize,
          status: 'any',
          orderby: 'modified',
          order: 'asc',
          // --- CAMBIO TEMPORAL PARA FORZAR LA RESINCRONIZACIÓN ---
          // La siguiente línea está comentada a propósito para obtener todos los pedidos.
          // modified_after: lastSync ? lastSync.toISOString() : undefined
        })
      );

      if (orders.length === 0) {
        console.log(`   ℹ️ No hay más pedidos que procesar.`);
        break;
      }

      const wooIds = orders.map(o => o.id);
      const existingOrders = await query(`SELECT woocommerce_id, date_modified FROM \`orders\` WHERE woocommerce_id IN (?)`, [wooIds]);
      const existingMap = new Map(existingOrders.map(o => [o.woocommerce_id, new Date(o.date_modified)]));

      for (const wooOrder of orders) {
        try {
            const existingDate = existingMap.get(wooOrder.id);
            const wooModified = new Date(wooOrder.date_modified_gmt + 'Z');

            if (!existingDate) {
              await this.syncSingleOrder(wooOrder, false);
            } else if (wooModified > existingDate) {
              await this.syncSingleOrder(wooOrder, true);
            } else {
              // En una resincronización forzada, podríamos querer actualizar incluso si la fecha no ha cambiado.
              // Para ser seguros y rellenar los campos nuevos, lo actualizamos de todas formas.
              await this.syncSingleOrder(wooOrder, true);
              // this.stats.orders.skipped++; // No lo contamos como omitido en este caso
            }
        } catch(e) {
            console.error(`   ❌ Error procesando pedido #${wooOrder.number}:`, e.message);
            this.stats.orders.errors++;
        }
      }
      
      if (orders.length < this.batchSize) break;
      page++;
      await this.sleep(1000);
    }
    await this.updateLastSyncDate('last_order_sync');
  }
  
  async syncSingleOrder(wooOrder, isUpdate = false) {
    return transaction(async (conn) => {
        const customerId = await this.processCustomer(conn, wooOrder.billing);
        
        const orderData = {
          user_id: customerId,
          order_number: wooOrder.number,
          'status': this.mapOrderStatus(wooOrder.status),
          total_amount: parseFloat(wooOrder.total) || 0,
          subtotal: parseFloat(wooOrder.subtotal) || 0,
          tax_amount: parseFloat(wooOrder.total_tax) || 0,
          shipping_amount: parseFloat(wooOrder.shipping_total) || 0,
          discount_amount: parseFloat(wooOrder.discount_total) || 0,
          payment_method: wooOrder.payment_method || 'N/A',
          payment_status: this.mapPaymentStatus(wooOrder.status),
          payment_reference: wooOrder.transaction_id || null,
          billing_address: JSON.stringify(wooOrder.billing),
          shipping_address: JSON.stringify(wooOrder.shipping),
          notes: wooOrder.customer_note || null,
          woocommerce_id: wooOrder.id,
          currency: wooOrder.currency || 'COP',
          date_created: new Date(wooOrder.date_created_gmt + 'Z'),
          date_modified: new Date(wooOrder.date_modified_gmt + 'Z'),
          created_via: wooOrder.created_via,
          woo_version: wooOrder.version,
          prices_include_tax: wooOrder.prices_include_tax || false,
          customer_ip_address: wooOrder.customer_ip_address,
          customer_user_agent: wooOrder.customer_user_agent,
          date_paid: wooOrder.date_paid_gmt ? new Date(wooOrder.date_paid_gmt + 'Z') : null,
          date_completed: wooOrder.date_completed_gmt ? new Date(wooOrder.date_completed_gmt + 'Z') : null,
          cart_hash: wooOrder.cart_hash,
          shipping_lines: JSON.stringify(wooOrder.shipping_lines || []),
          coupon_lines: JSON.stringify(wooOrder.coupon_lines || []),
          fee_lines: JSON.stringify(wooOrder.fee_lines || []),
          tax_lines: JSON.stringify(wooOrder.tax_lines || []),
          order_meta_data: JSON.stringify(wooOrder.meta_data || [])
        };
        
        if (isUpdate) {
            const existingOrder = await conn.query('SELECT id FROM `orders` WHERE woocommerce_id = ?', [wooOrder.id]);
            if (existingOrder.length > 0) {
              const orderId = existingOrder[0].id;
              const updateQuery = 'UPDATE `orders` SET ' + Object.keys(orderData).map(key => `\`${key}\` = ?`).join(', ') + ' WHERE id = ?';
              const updateValues = [...Object.values(orderData), orderId];
              await conn.query(updateQuery, updateValues);
              await this.processOrderItems(conn, orderId, wooOrder.line_items);
              this.stats.orders.updated++;
              console.log(`   📝 Actualizado: Pedido #${wooOrder.number}`);
            } else {
              // Si marcaba para actualizar pero no existe, lo creamos.
              await this.syncSingleOrder(wooOrder, false);
            }
        } else {
            const columns = Object.keys(orderData).map(k => `\`${k}\``).join(',');
            const placeholders = Object.keys(orderData).map(() => '?').join(',');
            const result = await conn.query(`INSERT INTO \`orders\` (${columns}) VALUES (${placeholders})`, Object.values(orderData));
            await this.processOrderItems(conn, result.insertId, wooOrder.line_items);
            this.stats.orders.created++;
            console.log(`   ✅ Creado: Pedido #${wooOrder.number}`);
        }
    });
  }

  async processCustomer(conn, billing) {
    if (!billing || !billing.email) return null;
    try {
      const existingUser = await conn.query('SELECT id FROM `users` WHERE email = ?', [billing.email]);
      const userData = { 
        email: billing.email, 
        first_name: billing.first_name, 
        last_name: billing.last_name, 
        'name': `${billing.first_name} ${billing.last_name}`.trim(),
        phone: billing.phone 
      };

      if (existingUser.length > 0) {
        const userId = existingUser[0].id;
        const updateQuery = 'UPDATE `users` SET ' + Object.keys(userData).map(key => `\`${key}\` = ?`).join(', ') + ' WHERE id = ?';
        await conn.query(updateQuery, [...Object.values(userData), userId]);
        this.stats.customers.updated++;
        return userId;
      } else {
        const newUser = { ...userData, 'role': 'customer', password: 'temp_password_' + Date.now() };
        const columns = Object.keys(newUser).map(k => `\`${k}\``).join(',');
        const placeholders = Object.keys(newUser).map(() => '?').join(',');
        const result = await conn.query(`INSERT INTO \`users\` (${columns}) VALUES (${placeholders})`, Object.values(newUser));
        this.stats.customers.created++;
        return result.insertId;
      }
    } catch (error) { 
        console.error(`Error al procesar cliente ${billing.email}: ${error.message}`);
        this.stats.customers.errors++; 
        return null; 
    }
  }

  async processOrderItems(conn, orderId, lineItems) {
    await conn.query('DELETE FROM `order_items` WHERE order_id = ?', [orderId]);
    for (const item of lineItems) {
      try {
        const productResult = await conn.query('SELECT id FROM `products` WHERE woocommerce_id = ?', [item.product_id]);
        
        const itemData = { 
          order_id: orderId, 
          product_id: productResult.length > 0 ? productResult[0].id : null, 
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.total),
          tax_amount: parseFloat(item.total_tax),
          woocommerce_product_id: item.product_id,
          product_name: item.name,
          product_sku: item.sku,
          meta_data: JSON.stringify(item.meta_data || []),
          taxes_data: JSON.stringify(item.taxes || [])
        };

        const columns = Object.keys(itemData).map(k => `\`${k}\``).join(',');
        const placeholders = Object.keys(itemData).map(() => '?').join(',');
        await conn.query(`INSERT INTO \`order_items\` (${columns}) VALUES (${placeholders})`, Object.values(itemData));

        this.stats.orderItems.created++;
      } catch (error) { 
        console.error(`Error al procesar item ${item.name}: ${error.message}`);
        this.stats.orderItems.errors++; 
      }
    }
  }
  
  async getLastSyncDate(key) {
    const result = await query("SELECT value FROM `settings` WHERE key_name = ?", [key]);
    return result.length > 0 ? new Date(result[0].value) : null;
  }

  async updateLastSyncDate(key) {
    const now = new Date().toISOString();
    await query("INSERT INTO `settings` (key_name, value, type) VALUES (?, ?, 'string') ON DUPLICATE KEY UPDATE value = ?", [key, now, now]);
    console.log(`   ✅ Sincronización guardada. Próxima vez se buscará desde: ${now}`);
  }

  async addColumnIfNotExists(tableName, columnName, columnDefinition) {
    try {
      const columns = await query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [tableName, columnName]);
      if (columns.length === 0) {
        await query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
        console.log(`   ✅ Columna ${columnName} agregada a ${tableName}`);
      }
    } catch (error) {
      console.log(`   ⚠️  No se pudo agregar ${columnName} a ${tableName}: ${error.message}`);
    }
  }

  mapOrderStatus(wooStatus) { const map = { 'pending': 'pending', 'processing': 'processing', 'on-hold': 'processing', 'completed': 'delivered', 'cancelled': 'cancelled', 'refunded': 'cancelled', 'failed': 'cancelled' }; return map[wooStatus] || 'pending'; }
  mapPaymentStatus(wooStatus) { if (['completed', 'processing'].includes(wooStatus)) return 'completed'; if (wooStatus === 'pending' || wooStatus === 'on-hold') return 'pending'; return 'failed'; }
  sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  
  showStats() {
    console.log('\n📊 Estadísticas de Sincronización de Pedidos:');
    console.log('===========================================');
    console.log(`🛒 Pedidos:`);
    console.log(`   ✅ Creados: ${this.stats.orders.created}`);
    console.log(`   📝 Actualizados: ${this.stats.orders.updated}`);
    console.log(`   ⏭️  Omitidos: ${this.stats.orders.skipped}`);
    console.log(`   ❌ Errores: ${this.stats.orders.errors}`);
    console.log(`\n👥 Clientes:`);
    console.log(`   ✅ Creados: ${this.stats.customers.created}`);
    console.log(`   📝 Actualizados: ${this.stats.customers.updated}`);
    console.log(`   ❌ Errores: ${this.stats.customers.errors}`);
    console.log(`\n📋 Items de Pedidos:`);
    console.log(`   ✅ Creados: ${this.stats.orderItems.created}`);
    console.log(`   ❌ Errores: ${this.stats.orderItems.errors}`);
  }
}

if (require.main === module) {
  const syncManager = new OrdersSyncManager();
  syncManager.sync()
    .then(() => {
      console.log('\n✅ Sincronización de pedidos completada exitosamente.');
      process.exit(0);
    })
    .catch(() => {
      console.error('\n❌ La sincronización de pedidos falló.');
      process.exit(1);
    });
}