require('dotenv').config();

const WooCommerceService = require('../services/woocommerce');
const { query, transaction } = require('../lib/database');

class UsersSyncManager {
  constructor() {
    this.wooService = new WooCommerceService();
    this.stats = {
      customers: { created: 0, updated: 0, skipped: 0, errors: 0 }
    };
    
    this.maxRetries = parseInt(process.env.SYNC_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.SYNC_DELAY_BETWEEN_PAGES) || 2000;
    this.batchSize = parseInt(process.env.SYNC_BATCH_SIZE) || 100; // Los usuarios son menos "pesados", podemos usar un batch más grande
  }

  async retryOperation(operation) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if ((error.code === 'ECONNRESET' || error.message.includes('timeout')) && attempt < this.maxRetries) {
          console.log(`   ⚠️ Error de conexión (intento ${attempt}/${this.maxRetries}). Reintentando...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        } else {
          console.error('Error en la operación:', error);
          throw error;
        }
      }
    }
  }
  
  async sync() {
    console.log('👤 Iniciando sincronización de clientes...\n');
    try {
      await this.checkConnection();
      await this.verifyUserTables();
      console.log('👥 Sincronizando clientes...');
      await this.syncAllUsers();
      this.showStats();
    } catch (error) {
      console.error('❌ Error fatal en sincronización de clientes:', error.message);
      this.showStats();
      throw error;
    }
  }

  async checkConnection() {
    try {
      console.log('🔍 Verificando conectividad con la API de Clientes de WooCommerce...');
      await this.retryOperation(() => this.wooService.getCustomers({ page: 1, per_page: 1 }));
      console.log('✅ Conexión con la API de WooCommerce OK');
    } catch (error) {
      throw new Error('No se pudo establecer conexión con WooCommerce (endpoint de clientes).');
    }
  }

  /**
   * Verifica y añade las columnas necesarias a la tabla de usuarios.
   */
  async verifyUserTables() {
    console.log('🗃️ Verificando tabla de usuarios...');
    try {
      await this.addColumnIfNotExists('users', 'woocommerce_id', 'INT UNIQUE');
      await this.addColumnIfNotExists('users', 'username', 'VARCHAR(255)');
      await this.addColumnIfNotExists('users', 'avatar_url', 'VARCHAR(512)');
      await this.addColumnIfNotExists('users', 'date_registered_gmt', 'DATETIME NULL');
      await this.addColumnIfNotExists('users', 'billing_address_json', 'TEXT');
      await this.addColumnIfNotExists('users', 'shipping_address_json', 'TEXT');
      console.log('✅ Tabla de usuarios verificada correctamente');
    } catch (error) {
      console.error('❌ Error verificando la tabla de usuarios:', error); throw error;
    }
  }

  /**
   * Sincroniza todos los usuarios. El endpoint de /customers no soporta filtro `modified_after`,
   * por lo que la estrategia más segura es traerlos todos y usar INSERT...ON DUPLICATE KEY UPDATE.
   */
  async syncAllUsers() {
    let page = 1;
    while (true) {
      console.log(`   📄 Obteniendo página de clientes ${page}...`);
      
      const customers = await this.retryOperation(() => 
        this.wooService.getCustomers({
          page,
          per_page: this.batchSize,
          role: 'all' // Trae todos los roles, no solo 'customer'
        })
      );

      if (customers.length === 0) {
        console.log(`   ℹ️ No hay más clientes que sincronizar.`);
        break;
      }

      for (const customer of customers) {
        try {
          await this.processSingleUser(customer);
        } catch(e) {
            console.error(`   ❌ Error procesando cliente #${customer.id} (${customer.email}):`, e.message);
            this.stats.customers.errors++;
        }
      }
      
      if (customers.length < this.batchSize) break;
      page++;
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa entre páginas
    }
  }
  
  /**
   * Procesa un único cliente, insertándolo si es nuevo o actualizándolo si ya existe.
   * @param {object} customer - El objeto del cliente de la API de WooCommerce.
   */
  async processSingleUser(customer) {
    // Mapeo de datos desde WooCommerce a nuestra tabla
    const userData = {
      woocommerce_id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
      username: customer.username,
      role: customer.role === 'administrator' ? 'admin' : 'customer', // Mapeo de roles
      date_registered_gmt: new Date(customer.date_created_gmt + 'Z'),
      avatar_url: customer.avatar_url,
      phone: customer.billing.phone || null,
      billing_address_json: JSON.stringify(customer.billing),
      shipping_address_json: JSON.stringify(customer.shipping),
    };

    // Construcción de la consulta con ON DUPLICATE KEY UPDATE
    const columns = Object.keys(userData).map(k => `\`${k}\``).join(',');
    const placeholders = Object.keys(userData).map(() => '?').join(',');
    const updateAssignments = Object.keys(userData).map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ');

    // Creamos una contraseña temporal y segura para usuarios nuevos.
    // Esta contraseña no se actualiza si el usuario ya existe.
    const tempPassword = 'temp_password_' + Date.now() + Math.random();

    const finalUserData = { ...userData };
    delete finalUserData.woocommerce_id; // No incluir en la parte de SET

    const finalQuery = `
      INSERT INTO \`users\` (woocommerce_id, password, ${Object.keys(finalUserData).map(k => `\`${k}\``).join(',')})
      VALUES (?, ?, ${Object.keys(finalUserData).map(() => '?').join(',')})
      ON DUPLICATE KEY UPDATE ${Object.keys(finalUserData).map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ')}
    `;

    const values = [customer.id, tempPassword, ...Object.values(finalUserData)];

    const result = await query(finalQuery, values);

    if (result.affectedRows === 1) {
        console.log(`   ✅ Creado: Cliente #${customer.id} - ${customer.email}`);
        this.stats.customers.created++;
    } else if (result.affectedRows === 2) {
        console.log(`   📝 Actualizado: Cliente #${customer.id} - ${customer.email}`);
        this.stats.customers.updated++;
    } else {
        this.stats.customers.skipped++;
    }
  }
  
  async addColumnIfNotExists(tableName, columnName, columnDefinition) {
    const columns = await query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [tableName, columnName]);
    if (columns.length === 0) {
      await query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
      console.log(`   ✅ Columna ${columnName} agregada a la tabla ${tableName}`);
    }
  }

  showStats() {
    console.log('\n📊 Estadísticas de Sincronización de Clientes:');
    console.log('==============================================');
    console.log(`   ✅ Creados: ${this.stats.customers.created}`);
    console.log(`   📝 Actualizados: ${this.stats.customers.updated}`);
    console.log(`   ⏭️  Omitidos (sin cambios): ${this.stats.customers.skipped}`);
    console.log(`   ❌ Errores: ${this.stats.customers.errors}`);
  }
}

// Bloque principal para ejecutar el script
if (require.main === module) {
  const syncManager = new UsersSyncManager();
  syncManager.sync()
    .then(() => {
      console.log('\n✅ Sincronización de clientes completada exitosamente.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ La sincronización de clientes falló.', err);
      process.exit(1);
    });
}