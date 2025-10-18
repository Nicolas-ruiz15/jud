// scripts/sync-woocommerce-orders-incremental.js
require('dotenv').config();

const WooCommerceService = require('../services/woocommerce');
const { query, transaction } = require('../lib/database');

class OrdersIncrementalSyncManager {
  constructor() {
    this.wooService = new WooCommerceService();
    this.stats = {
      orders: { created: 0, updated: 0, skipped: 0, errors: 0 },
      orderItems: { created: 0, errors: 0 },
      customers: { created: 0, updated: 0, errors: 0 }
    };
  }

  // Sincronización incremental principal
  async incrementalSync() {
    console.log('🔄 Iniciando sincronización incremental de pedidos...\n');
    
    try {
      // 1. Verificar conectividad
      await this.checkConnection();
      
      // 2. Sincronizar solo pedidos nuevos/modificados
      console.log('🛒 Sincronización incremental de pedidos...');
      await this.syncOrdersIncremental();
      
      this.showStats();
      
    } catch (error) {
      console.error('❌ Error en sincronización incremental de pedidos:', error);
      this.showStats();
      throw error;
    }
  }

  async checkConnection() {
    try {
      console.log('🔍 Verificando conectividad...');
      await this.wooService.getOrders({ page: 1, per_page: 1 });
      console.log('✅ Conexión OK');
    } catch (error) {
      throw new Error('No se pudo conectar a WooCommerce API');
    }
  }

  // Sincronizar solo pedidos nuevos o modificados
  async syncOrdersIncremental() {
    try {
      // Obtener fecha de última sincronización de pedidos
      const lastSync = await this.getLastOrderSyncDate();
      console.log(`   📅 Última sincronización: ${lastSync ? lastSync.toISOString() : 'Primera vez'}`);
      
      let page = 1;
      let totalProcessed = 0;
      
      while (true) {
        console.log(`   📄 Obteniendo página ${page}...`);
        
        const orders = await this.wooService.getOrders({
          page,
          per_page: 50,
          status: 'any',
          orderby: 'date',
          order: 'desc',
          // Solo pedidos modificados después de la última sincronización
          modified_after: lastSync ? lastSync.toISOString() : undefined
        });
        
        if (orders.length === 0) {
          console.log(`   ℹ️  No hay más pedidos nuevos/modificados`);
          break;
        }
        
        // Obtener pedidos existentes en esta página
        const wooIds = orders.map(o => o.id);
        const existingOrders = await query(
          `SELECT woocommerce_id, date_modified FROM orders WHERE woocommerce_id IN (${wooIds.map(() => '?').join(',')})`,
          wooIds
        );
        
        const existingMap = new Map(
          existingOrders.map(o => [o.woocommerce_id, new Date(o.date_modified)])
        );
        
        for (const wooOrder of orders) {
          try {
            const existingDate = existingMap.get(wooOrder.id);
            const wooModified = new Date(wooOrder.date_modified);
            
            if (!existingDate) {
              // Pedido nuevo
              await this.syncSingleOrder(wooOrder, false);
              totalProcessed++;
            } else if (wooModified > existingDate) {
              // Pedido modificado
              await this.syncSingleOrder(wooOrder, true);
              totalProcessed++;
            } else {
              // Sin cambios
              this.stats.orders.skipped++;
              console.log(`   ⏭️  Omitido (sin cambios): Pedido #${wooOrder.number}`);
            }
          } catch (error) {
            console.error(`   ❌ Error con pedido #${wooOrder.number}:`, error.message);
            this.stats.orders.errors++;
          }
        }
        
        console.log(`   📊 Página ${page}: ${totalProcessed} procesados de ${orders.length} obtenidos`);
        page++;
        
        // Pausa corta entre páginas
        await this.sleep(1000);
      }
      
      // Actualizar fecha de última sincronización de pedidos
      await this.updateLastOrderSyncDate();
      
      console.log(`   ✅ Total procesado: ${totalProcessed} pedidos`);
      
    } catch (error) {
      console.error('Error en sincronización incremental de pedidos:', error);
      throw error;
    }
  }

  // Obtener fecha de última sincronización de pedidos
  async getLastOrderSyncDate() {
    try {
      const result = await query(
        "SELECT value FROM settings WHERE key_name = 'last_orders_sync'"
      );
      
      if (result.length > 0 && result[0].value) {
        return new Date(result[0].value);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Actualizar fecha de última sincronización de pedidos
  async updateLastOrderSyncDate() {
    try {
      const now = new Date().toISOString();
      await query(`
        INSERT INTO settings (key_name, value, type) 
        VALUES ('last_orders_sync', ?, 'string') 
        ON DUPLICATE KEY UPDATE value = ?, updated_at = CURRENT_TIMESTAMP
      `, [now, now]);
    } catch (error) {
      console.error('Error actualizando fecha de sincronización de pedidos:', error);
    }
  }

  // Sincronizar pedido individual (versión optimizada)
  async syncSingleOrder(wooOrder, isUpdate = false) {
    return await transaction(async (conn) => {
      try {
        // 1. Procesar cliente si es necesario
        const customerId = await this.processCustomer(conn, wooOrder);
        
        // 2. Verificar si el pedido existe
        const existingOrder = await conn.query(
          'SELECT id FROM orders WHERE woocommerce_id = ?',
          [wooOrder.id]
        );
        
        // Preparar datos del pedido
        const orderData = {
          order_number: wooOrder.number,
          customer_id: customerId,
          customer_email: wooOrder.billing.email,
          customer_first_name: wooOrder.billing.first_name,
          customer_last_name: wooOrder.billing.last_name,
          customer_phone: wooOrder.billing.phone,
          status: this.mapOrderStatus(wooOrder.status),
          total: parseFloat(wooOrder.total) || 0,
          subtotal: parseFloat(wooOrder.subtotal) || 0,
          tax_total: parseFloat(wooOrder.total_tax) || 0,
          shipping_total: parseFloat(wooOrder.shipping_total) || 0,
          discount_total: parseFloat(wooOrder.discount_total) || 0,
          currency: wooOrder.currency || 'COP',
          payment_method: wooOrder.payment_method || null,
          payment_method_title: wooOrder.payment_method_title || null,
          transaction_id: wooOrder.transaction_id || null,
          billing_address: JSON.stringify(wooOrder.billing),
          shipping_address: JSON.stringify(wooOrder.shipping),
          order_notes: wooOrder.customer_note || null,
          woocommerce_id: wooOrder.id,
          date_created: new Date(wooOrder.date_created),
          date_modified: new Date(wooOrder.date_modified)
        };
        
        let orderId;
        
        if (existingOrder.length > 0) {
          // Actualizar pedido existente
          await conn.query(
            `UPDATE orders SET 
             status = ?, total = ?, subtotal = ?, tax_total = ?, 
             shipping_total = ?, discount_total = ?, payment_method = ?,
             payment_method_title = ?, transaction_id = ?, billing_address = ?,
             shipping_address = ?, order_notes = ?, date_modified = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE woocommerce_id = ?`,
            [
              orderData.status, orderData.total, orderData.subtotal, orderData.tax_total,
              orderData.shipping_total, orderData.discount_total, orderData.payment_method,
              orderData.payment_method_title, orderData.transaction_id, orderData.billing_address,
              orderData.shipping_address, orderData.order_notes, orderData.date_modified,
              wooOrder.id
            ]
          );
          orderId = existingOrder[0].id;
          this.stats.orders.updated++;
          console.log(`   📝 Actualizado: Pedido #${wooOrder.number} - Estado: ${orderData.status}`);
        } else {
          // Crear nuevo pedido
          const result = await conn.query(
            `INSERT INTO orders (
              order_number, customer_id, customer_email, customer_first_name, customer_last_name, customer_phone,
              status, total, subtotal, tax_total, shipping_total, discount_total, currency,
              payment_method, payment_method_title, transaction_id, billing_address, shipping_address,
              order_notes, woocommerce_id, date_created, date_modified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              orderData.order_number, orderData.customer_id, orderData.customer_email,
              orderData.customer_first_name, orderData.customer_last_name, orderData.customer_phone,
              orderData.status, orderData.total, orderData.subtotal, orderData.tax_total,
              orderData.shipping_total, orderData.discount_total, orderData.currency,
              orderData.payment_method, orderData.payment_method_title, orderData.transaction_id,
              orderData.billing_address, orderData.shipping_address, orderData.order_notes,
              orderData.woocommerce_id, orderData.date_created, orderData.date_modified
            ]
          );
          orderId = result.insertId;
          this.stats.orders.created++;
          console.log(`   ✅ Creado: Pedido #${wooOrder.number} - Total: $${orderData.total}`);
        }
        
        // 3. Actualizar items del pedido (solo si es necesario)
        if (!isUpdate || await this.orderItemsChanged(conn, orderId, wooOrder.line_items)) {
          await this.processOrderItems(conn, orderId, wooOrder.line_items);
        }
        
      } catch (error) {
        console.error(`Error procesando pedido #${wooOrder.number}:`, error);
        throw error;
      }
    });
  }

  // Verificar si los items del pedido han cambiado
  async orderItemsChanged(conn, orderId, newItems) {
    try {
      const existingItems = await conn.query(
        'SELECT COUNT(*) as count FROM order_items WHERE order_id = ?',
        [orderId]
      );
      
      return existingItems[0].count !== newItems.length;
    } catch (error) {
      return true; // En caso de error, asumir que cambiaron
    }
  }

  // Procesar cliente (versión optimizada)
  async processCustomer(conn, wooOrder) {
    try {
      if (!wooOrder.billing.email) {
        return null;
      }
      
      const existingCustomer = await conn.query(
        'SELECT id FROM customers WHERE email = ?',
        [wooOrder.billing.email]
      );
      
      if (existingCustomer.length > 0) {
        // Solo actualizar información básica
        await conn.query(
          `UPDATE customers SET 
           first_name = ?, last_name = ?, phone = ?, 
           updated_at = CURRENT_TIMESTAMP
           WHERE email = ?`,
          [
            wooOrder.billing.first_name, wooOrder.billing.last_name, 
            wooOrder.billing.phone, wooOrder.billing.email
          ]
        );
        this.stats.customers.updated++;
        return existingCustomer[0].id;
      } else {
        // Crear nuevo cliente
        const result = await conn.query(
          `INSERT INTO customers (
            email, first_name, last_name, phone, company, address_1, address_2,
            city, state, postcode, country, woocommerce_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            wooOrder.billing.email, wooOrder.billing.first_name, wooOrder.billing.last_name,
            wooOrder.billing.phone, wooOrder.billing.company, wooOrder.billing.address_1,
            wooOrder.billing.address_2, wooOrder.billing.city, wooOrder.billing.state,
            wooOrder.billing.postcode, wooOrder.billing.country, wooOrder.customer_id || null
          ]
        );
        this.stats.customers.created++;
        return result.insertId;
      }
    } catch (error) {
      console.error('Error procesando cliente:', error);
      this.stats.customers.errors++;
      return null;
    }
  }

  // Procesar items del pedido
  async processOrderItems(conn, orderId, lineItems) {
    try {
      // Eliminar items existentes
      await conn.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      
      for (const item of lineItems) {
        try {
          // Buscar producto en nuestra BD
          const productResult = await conn.query(
            'SELECT id FROM products WHERE woocommerce_id = ?',
            [item.product_id]
          );
          
          const productId = productResult.length > 0 ? productResult[0].id : null;
          
          await conn.query(
            `INSERT INTO order_items (
              order_id, product_id, product_name, product_sku, quantity,
              unit_price, total_price, tax_amount, woocommerce_product_id,
              product_variation_id, meta_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              orderId, productId, item.name, item.sku,
              parseInt(item.quantity), parseFloat(item.price),
              parseFloat(item.total), parseFloat(item.total_tax),
              item.product_id, item.variation_id || null,
              JSON.stringify(item.meta_data || [])
            ]
          );
          
          this.stats.orderItems.created++;
        } catch (error) {
          console.error(`Error procesando item ${item.name}:`, error);
          this.stats.orderItems.errors++;
        }
      }
    } catch (error) {
      console.error('Error procesando items del pedido:', error);
    }
  }

  // Mapear estados de pedido
  mapOrderStatus(wooStatus) {
    const statusMap = {
      'pending': 'pending',
      'processing': 'processing',
      'on-hold': 'on-hold',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'failed': 'failed'
    };
    
    return statusMap[wooStatus] || 'pending';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showStats() {
    console.log('\n📊 Estadísticas de Sincronización Incremental de Pedidos:');
    console.log('======================================================');
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
    console.log('\n🎉 Sincronización incremental de pedidos completada!');
  }
}

// Función principal
async function incrementalOrdersSync() {
  const syncManager = new OrdersIncrementalSyncManager();
  
  try {
    await syncManager.incrementalSync();
  } catch (error) {
    console.error('Error en sincronización incremental de pedidos:', error);
    process.exit(1);
  }
}

// CLI Interface
if (require.main === module) {
  console.log('🔄 Iniciando sincronización incremental de pedidos...');
  incrementalOrdersSync()
    .then(() => {
      console.log('✅ Sincronización incremental de pedidos completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en sincronización incremental de pedidos:', error);
      process.exit(1);
    });
}

module.exports = { incrementalOrdersSync, OrdersIncrementalSyncManager };