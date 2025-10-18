// scripts/verify-email.js
// Script para verificar la configuración de email sin depender de la web

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function verifyEmailSetup() {
  console.log('🔍 Verificando configuración de email...\n');

  // 1. Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  const envVars = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***configurado***' : undefined
  };

  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? '✅' : '❌'} ${value || 'No configurado'}`);
  });

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('\n❌ Faltan variables de entorno críticas.');
    console.log('💡 Asegúrate de tener un archivo .env.local con:');
    console.log('   SMTP_HOST=smtp.zoho.com');
    console.log('   SMTP_PORT=465');
    console.log('   SMTP_USER=contacto@judaicabreslovcolombia.com');
    console.log('   SMTP_PASSWORD=tu-contraseña');
    return false;
  }

  // 2. Probar configuración de transporter
  console.log('\n🔧 Configurando transporter...');
  let transporter;
  try {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Para pruebas
      }
    });
    console.log('✅ Transporter configurado correctamente');
  } catch (error) {
    console.log('❌ Error configurando transporter:', error.message);
    return false;
  }

  // 3. Verificar conexión SMTP
  console.log('\n🌐 Verificando conexión SMTP...');
  try {
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa');
  } catch (error) {
    console.log('❌ Error de conexión SMTP:', error.message);
    console.log('💡 Posibles soluciones:');
    console.log('   - Verifica las credenciales de Zoho');
    console.log('   - Asegúrate de que la contraseña sea correcta');
    console.log('   - Verifica que el puerto 465 esté abierto');
    console.log('   - Comprueba tu conexión a internet');
    return false;
  }

  // 4. Enviar email de prueba si se proporciona
  const testEmail = process.argv[2];
  if (testEmail) {
    console.log(`\n📧 Enviando email de prueba a: ${testEmail}`);
    try {
      const result = await transporter.sendMail({
        from: {
          name: 'Judaica Breslov Colombia',
          address: process.env.SMTP_USER
        },
        to: testEmail,
        subject: '✅ Prueba del Sistema de Email - Judaica Breslov',
        html: `
          <h2>✅ ¡Sistema de Email Funcionando!</h2>
          <p>Si recibes este email, significa que:</p>
          <ul>
            <li>✅ La configuración SMTP está correcta</li>
            <li>✅ Las credenciales de Zoho funcionan</li>
            <li>✅ El servidor puede enviar emails</li>
            <li>✅ El sistema está listo para tickets</li>
          </ul>
          <hr>
          <p><strong>Detalles técnicos:</strong></p>
          <p>Servidor: ${process.env.SMTP_HOST}</p>
          <p>Usuario: ${process.env.SMTP_USER}</p>
          <p>Fecha: ${new Date().toLocaleString('es-CO')}</p>
          <hr>
          <p><em>Judaica Breslov Colombia - Sistema de Tickets</em></p>
        `,
        text: `
Sistema de Email Funcionando!

Si recibes este email, el sistema está configurado correctamente.

Detalles:
- Servidor: ${process.env.SMTP_HOST}
- Usuario: ${process.env.SMTP_USER}
- Fecha: ${new Date().toLocaleString('es-CO')}

Judaica Breslov Colombia - Sistema de Tickets
        `
      });

      console.log('✅ Email de prueba enviado exitosamente');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Response: ${result.response}`);
    } catch (error) {
      console.log('❌ Error enviando email de prueba:', error.message);
      return false;
    }
  }

  console.log('\n🎉 ¡Verificación completa exitosa!');
  console.log('💡 El sistema de email está listo para funcionar.');
  return true;
}

// Función para mostrar ayuda
function showHelp() {
  console.log('🧪 Script de Verificación de Email - Judaica Breslov Colombia\n');
  console.log('Uso:');
  console.log('  node scripts/verify-email.js                    # Solo verificar configuración');
  console.log('  node scripts/verify-email.js tu@email.com       # Verificar y enviar email de prueba');
  console.log('');
  console.log('Ejemplos:');
  console.log('  node scripts/verify-email.js');
  console.log('  node scripts/verify-email.js admin@tudominio.com');
  console.log('');
  console.log('Requisitos:');
  console.log('  - Archivo .env.local con credenciales SMTP');
  console.log('  - nodemailer instalado (npm install nodemailer)');
  console.log('  - Conexión a internet');
}

// Ejecutar script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  verifyEmailSetup()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = { verifyEmailSetup };