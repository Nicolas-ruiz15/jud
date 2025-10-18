// pages/api/test-email.js
// API simplificada para probar emails con mejor manejo de errores

export default async function handler(req, res) {
  // Permitir solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido. Solo POST.'
    });
  }

  // Headers para evitar problemas de CORS y cache
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  console.log('🧪 API test-email llamada:', req.body);

  try {
    const { action, email } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro "action" es requerido'
      });
    }

    // Importar servicios de email de forma dinámica para evitar errores de inicialización
    let emailService;
    try {
      emailService = await import('../../lib/emailService');
    } catch (importError) {
      console.error('❌ Error importando emailService:', importError);
      return res.status(500).json({
        success: false,
        message: 'Error cargando servicio de email',
        error: importError.message,
        tip: 'Verifica que el archivo lib/emailService.js existe y está bien formado'
      });
    }

    let result;

    switch (action) {
      case 'connection':
        console.log('🔍 Verificando conexión SMTP...');
        result = await emailService.testEmailConnection();
        break;

      case 'status':
        console.log('📊 Obteniendo estado del servicio...');
        result = emailService.getEmailServiceStatus();
        break;

      case 'test':
        if (!email) {
          return res.status(400).json({
            success: false,
            message: 'Email requerido para prueba'
          });
        }
        console.log(`📧 Enviando email de prueba a: ${email}`);
        result = await emailService.sendTestEmail(email, 'manual_test');
        break;

      case 'simple':
        if (!email) {
          return res.status(400).json({
            success: false,
            message: 'Email requerido para prueba simple'
          });
        }
        
        console.log(`📧 Enviando email simple a: ${email}`);
        
        // Email simple sin plantillas complejas
        const simpleHtml = `
          <h2>✅ Prueba Simple del Sistema de Email</h2>
          <p>Si recibes este email, el sistema está funcionando correctamente.</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
          <p><strong>Servidor:</strong> ${process.env.SMTP_HOST}</p>
          <p><strong>Usuario:</strong> ${process.env.SMTP_USER}</p>
          <hr>
          <p><em>Judaica Breslov Colombia - Sistema de Tickets</em></p>
        `;
        
        // Importar función básica de envío
        const { sendEmail } = await import('../../lib/emailService');
        result = await sendEmail({
          to: email,
          subject: '✅ Prueba Simple - Sistema de Email',
          html: simpleHtml
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Acción no válida: ${action}`,
          availableActions: ['connection', 'status', 'test', 'simple']
        });
    }

    console.log(`✅ Acción ${action} completada:`, result);

    return res.status(200).json({
      success: true,
      action: action,
      result: result,
      timestamp: new Date().toISOString(),
      message: `Prueba de ${action} completada`
    });

  } catch (error) {
    console.error(`❌ Error en API test-email:`, error);
    
    // Información detallada del error para debugging
    const errorInfo = {
      success: false,
      message: 'Error interno en la prueba de email',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nodeVersion: process.version
    };

    // Agregar información específica del entorno
    if (process.env.NODE_ENV === 'development') {
      errorInfo.environmentVars = {
        SMTP_HOST: process.env.SMTP_HOST || 'No configurado',
        SMTP_PORT: process.env.SMTP_PORT || 'No configurado',
        SMTP_USER: process.env.SMTP_USER || 'No configurado',
        SMTP_PASSWORD: !!process.env.SMTP_PASSWORD ? 'Configurado' : 'No configurado',
        NODE_ENV: process.env.NODE_ENV
      };
    }

    return res.status(500).json(errorInfo);
  }
}

// Función helper para diagnóstico rápido
export async function diagnoseEmailSystem() {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  // Verificar variables de entorno
  diagnosis.checks.environmentVars = {
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_PORT: !!process.env.SMTP_PORT,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
    values: process.env.NODE_ENV === 'development' ? {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER
    } : 'Hidden in production'
  };

  // Verificar nodemailer
  try {
    await import('nodemailer');
    diagnosis.checks.nodemailer = { available: true };
  } catch (error) {
    diagnosis.checks.nodemailer = { 
      available: false, 
      error: error.message,
      solution: 'Run: npm install nodemailer'
    };
  }

  // Verificar servicio de email
  try {
    const emailService = await import('../../lib/emailService');
    diagnosis.checks.emailService = { 
      imported: true,
      status: emailService.getEmailServiceStatus ? emailService.getEmailServiceStatus() : 'Status function not available'
    };
  } catch (error) {
    diagnosis.checks.emailService = { 
      imported: false, 
      error: error.message,
      solution: 'Check lib/emailService.js file exists and is valid'
    };
  }

  return diagnosis;
}