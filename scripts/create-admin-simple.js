// scripts/create-admin-simple.js
const bcrypt = require('bcryptjs');
const { query, closePool } = require('../lib/database');

async function createAdminSimple() {
  try {
    console.log('🔧 Creando usuario administrador...\n');

    // Datos del admin usando la estructura actual de tu tabla
    const adminData = {
      email: 'contacto@judaicabreslovcolombia.com',
      password: '15975312',
      name: 'Admin Sistema', // Tu tabla tiene 'name' en lugar de first_name/last_name
      role: 'admin'
    };

    // Verificar si ya existe
    const existingAdmin = await query(
      'SELECT id, email, role FROM users WHERE email = ? OR role = "admin"',
      [adminData.email]
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Ya existe un usuario administrador:');
      console.log('📧 Email:', existingAdmin[0].email);
      console.log('👤 Rol:', existingAdmin[0].role);
      console.log('\n✅ Puedes usar este usuario para acceder al panel\n');
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Insertar usuario admin con la estructura exacta de tu tabla
    const result = await query(`
      INSERT INTO users (email, password, name, role) 
      VALUES (?, ?, ?, ?)
    `, [
      adminData.email,
      hashedPassword,
      adminData.name,
      adminData.role
    ]);

    console.log('✅ Usuario administrador creado exitosamente!\n');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Contraseña temporal:', adminData.password);
    console.log('👤 Nombre:', adminData.name);
    console.log('🔰 Rol:', adminData.role);
    console.log('🆔 ID:', result.insertId);
    
    console.log('\n🌐 ACCESO AL PANEL:');
    console.log('   URL: http://localhost:3000/admin/login');
    console.log('   Email: admin@judaicabreslovcolombia.com');
    console.log('   Contraseña: admin123!');
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   • Cambiar la contraseña después del primer login');
    console.log('   • Ejecutar: npm run dev');
    console.log('   • Acceder al panel de administración\n');

    // Verificar que se creó correctamente
    const verifyUser = await query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    console.log('🔍 USUARIO VERIFICADO:');
    console.log(verifyUser[0]);

  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('\n💡 Ya existe un usuario con este email');
      console.log('🔍 Verificando usuarios existentes...');
      
      try {
        const users = await query('SELECT id, email, name, role FROM users WHERE role = "admin" OR email LIKE "%admin%"');
        if (users.length > 0) {
          console.log('\n👥 Usuarios admin encontrados:');
          users.forEach(user => {
            console.log(`   • ${user.email} (${user.name}) - ${user.role}`);
          });
        }
      } catch (err) {
        console.log('No se pudieron verificar usuarios existentes');
      }
    }
    
    process.exit(1);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  createAdminSimple();
}

module.exports = { createAdminSimple };