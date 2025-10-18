// lib/emailService.js
// Versión con mejor manejo de errores y debugging

import nodemailer from 'nodemailer';

// Verificar variables de entorno al cargar el módulo
const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes para email:', missingVars);
  console.log('📋 Variables requeridas:', requiredEnvVars);
  console.log('🔍 Variables encontradas:', {
    SMTP_HOST: process.env.SMTP_HOST ? '✅' : '❌',
    SMTP_USER: process.env.SMTP_USER ? '✅' : '❌', 
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '✅' : '❌',
    SMTP_PORT: process.env.SMTP_PORT || '465 (default)'
  });
}

// Configurar el transportador con manejo de errores mejorado
let transporter = null;
let transporterError = null;

try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true, // true para puerto 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 5000,    // 5 segundos
    socketTimeout: 10000,     // 10 segundos
  });
  
  console.log('✅ Transporter SMTP configurado correctamente');
} catch (error) {
  console.error('❌ Error configurando transporter SMTP:', error);
  transporterError = error;
}

// Verificar la conexión SMTP de forma asíncrona
let smtpVerified = false;
if (transporter && !transporterError) {
  transporter.verify(function (error, success) {
    if (error) {
      console.error('❌ Falló la verificación SMTP:', error.message);
      smtpVerified = false;
      transporterError = error;
    } else {
      console.log('✅ Conexión SMTP verificada exitosamente');
      smtpVerified = true;
    }
  });
}

/**
 * Función base para enviar emails con manejo robusto de errores
 */
async function sendEmail({ to, subject, html, from = process.env.SMTP_USER }) {
  // Validaciones previas
  if (!to || !subject || !html) {
    throw new Error('Parámetros requeridos: to, subject, html');
  }

  if (!transporter) {
    const error = transporterError || new Error('Transporter SMTP no configurado');
    console.error('❌ No se puede enviar email - transporter no disponible:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Simulando envío exitoso en desarrollo...');
      return { 
        success: false, 
        error: error.message,
        simulated: true,
        message: 'Email simulado en desarrollo' 
      };
    }
    throw error;
  }

  if (!from) {
    throw new Error('Email del remitente (from) es requerido');
  }

  try {
    console.log(`📧 Iniciando envío de email...`);
    console.log(`   Para: ${to}`);
    console.log(`   Asunto: ${subject}`);
    console.log(`   Desde: ${from}`);

    const mailOptions = {
      from: {
        name: process.env.SITE_NAME || 'Judaica Breslov Colombia',
        address: from
      },
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, ''), // Fallback texto plano
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado exitosamente');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    console.error('   Error code:', error.code);
    console.error('   Error command:', error.command);
    
    // En desarrollo, no fallar el proceso principal
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Email falló en desarrollo, continuando proceso...');
      return { 
        success: false, 
        error: error.message,
        code: error.code,
        command: error.command,
        message: 'Email failed in development mode' 
      };
    }
    
    throw new Error(`Error al enviar email: ${error.message}`);
  }
}

/**
 * Función para verificar la conexión SMTP
 */
export async function testEmailConnection() {
  console.log('🔍 Verificando conexión SMTP...');
  
  if (!transporter) {
    const error = transporterError || new Error('Transporter no configurado');
    console.error('❌ No se puede verificar - transporter no disponible');
    return { 
      success: false, 
      error: error.message,
      details: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        hasPassword: !!process.env.SMTP_PASSWORD,
        transporterError: transporterError?.message
      }
    };
  }

  try {
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada');
    return { 
      success: true, 
      message: 'Conexión SMTP exitosa',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        secure: true
      }
    };
  } catch (error) {
    console.error('❌ Error en verificación SMTP:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      details: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        hasPassword: !!process.env.SMTP_PASSWORD
      }
    };
  }
}

/**
 * Función para enviar emails de prueba
 */
export async function sendTestEmail(toEmail, testType = 'connection') {
  console.log(`🧪 Enviando email de prueba (${testType}) a: ${toEmail}`);
  
  try {
    // Importar plantilla solo cuando se necesita (evita errores de importación circular)
    const { getTestEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getTestEmailTemplate({ testType });
    const subject = `✅ Prueba de Email - Sistema de Tickets [${testType.toUpperCase()}]`;
    
    return await sendEmail({
      to: toEmail,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando email de prueba:', error);
    throw error;
  }
}

/**
 * Función para enviar email de confirmación de ticket
 */
export async function sendTicketCreatedEmail(ticket, autoResponse = null) {
  console.log(`📧 Enviando confirmación de ticket ${ticket.ticket_number} a ${ticket.email}`);
  
  try {
    const { getTicketCreatedEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getTicketCreatedEmailTemplate({ ticket, autoResponse });
    const subject = `Ticket ${ticket.ticket_number} - Confirmación Recibida`;
    
    return await sendEmail({
      to: ticket.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando confirmación de ticket:', error);
    throw error;
  }
}

/**
 * Función para enviar respuesta del equipo
 */
export async function sendTicketResponseEmail(ticket, responseMessage, adminName) {
  console.log(`📧 Enviando respuesta de ticket ${ticket.ticket_number} a ${ticket.email}`);
  
  try {
    const { getTicketResponseEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getTicketResponseEmailTemplate({ ticket, responseMessage, adminName });
    const subject = `Re: Ticket ${ticket.ticket_number} - ${ticket.subject}`;
    
    return await sendEmail({
      to: ticket.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando respuesta de ticket:', error);
    throw error;
  }
}

/**
 * Función para enviar email de resolución
 */
export async function sendTicketResolvedEmail(ticket, resolution = null) {
  console.log(`📧 Enviando resolución de ticket ${ticket.ticket_number} a ${ticket.email}`);
  
  try {
    const { getTicketResolvedEmailTemplate } = await import('./emailTemplates.js');
    
    const isResolved = ticket.status === 'resolved';
    const html = getTicketResolvedEmailTemplate({ ticket, resolution });
    const subject = `${isResolved ? '✅ RESUELTO' : '🔒 CERRADO'}: Ticket ${ticket.ticket_number}`;
    
    return await sendEmail({
      to: ticket.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando resolución de ticket:', error);
    throw error;
  }
}

/**
 * Función para enviar notificación al admin
 */
export async function sendNewTicketAdminEmail(ticket) {
  console.log(`📧 Enviando notificación admin para ticket ${ticket.ticket_number}`);
  
  try {
    const { getNewTicketAdminEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getNewTicketAdminEmailTemplate({ ticket });
    const priorityPrefix = ticket.priority === 'high' ? '[URGENTE] ' : '';
    const subject = `🎫 ${priorityPrefix}Nuevo Ticket ${ticket.ticket_number}`;
    
    const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || 'contacto@judaicabreslovcolombia.com';
    
    return await sendEmail({
      to: adminEmail,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando notificación admin:', error);
    throw error;
  }
}

/**
 * Obtener estado del servicio de email
 */
export function getEmailServiceStatus() {
  return {
    connected: smtpVerified,
    hasTransporter: !!transporter,
    transporterError: transporterError?.message || null,
    config: {
      host: process.env.SMTP_HOST || 'No configurado',
      port: process.env.SMTP_PORT || 'No configurado',
      user: process.env.SMTP_USER || 'No configurado',
      hasPassword: !!process.env.SMTP_PASSWORD,
      secure: true
    },
    environment: process.env.NODE_ENV || 'development',
    lastCheck: new Date().toISOString()
  };
}

// Exportar función de recuperación de contraseña (compatible con tu código existente)
export async function sendPasswordResetEmail({ to, name, resetUrl, expiryTime }) {
  console.log('🔐 Enviando email de recuperación de contraseña');
  
  // En desarrollo, mostrar enlace en consola
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔗 ENLACE DE RECUPERACIÓN (DESARROLLO):');
    console.log(resetUrl);
    console.log('\n');
  }

  try {
    const html = getPasswordResetEmailTemplate({ name, resetUrl, expiryTime });
    const subject = '🔐 Recuperar tu contraseña - Judaica Breslov Colombia';

    return await sendEmail({
      to: to,
      subject: subject,
      html: html
    });

  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Email falló en desarrollo, pero continuando...');
      return { success: true, error: error.message };
    }
    
    throw error;
  }
}

// Plantilla de recuperación de contraseña (inline para evitar dependencias circulares)
function getPasswordResetEmailTemplate({ name, resetUrl, expiryTime }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recuperar Contraseña</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a8a, #3730a3); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #3730a3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .warning { background: #fef3cd; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Recuperar Contraseña</h1>
          <p>Judaica Breslov Colombia</p>
        </div>
        <div class="content">
          <h2>¡Hola ${name}!</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p><a href="${resetUrl}" class="button">Restablecer Contraseña</a></p>
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este enlace es válido por ${expiryTime} únicamente.
          </div>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// AGREGAR estas funciones al final de emailService.js (después de las existentes)

/**
 * Función para enviar email de verificación de cuenta
 */
export async function sendEmailVerification(user, verificationToken) {
  console.log(`📧 Enviando email de verificación a ${user.email}`);
  
  try {
    const { getEmailVerificationTemplate } = await import('./emailTemplates.js');
    
    const verificationUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    const html = getEmailVerificationTemplate({ user, verificationUrl });
    const subject = '🔐 Verifica tu cuenta - Judaica Breslov Colombia';
    
    return await sendEmail({
      to: user.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error);
    throw error;
  }
}

/**
 * Función para enviar email de bienvenida (después de verificar)
 */
export async function sendWelcomeEmail(user) {
  console.log(`📧 Enviando email de bienvenida a ${user.email}`);
  
  try {
    const { getWelcomeEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getWelcomeEmailTemplate({ user });
    const subject = '🎉 ¡Bienvenido/a! - Judaica Breslov Colombia';
    
    return await sendEmail({
      to: user.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    throw error;
  }
}

/**
 * Función para reenviar email de verificación
 */
export async function sendResendVerification(user, verificationToken) {
  console.log(`📧 Reenviando email de verificación a ${user.email}`);
  
  try {
    const { getResendVerificationTemplate } = await import('./emailTemplates.js');
    
    const verificationUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    const html = getResendVerificationTemplate({ user, verificationUrl });
    const subject = '🔄 Nuevo enlace de verificación - Judaica Breslov Colombia';
    
    return await sendEmail({
      to: user.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error reenviando email de verificación:', error);
    throw error;
  }
}
/**
 * Función para enviar email de confirmación de pedido
 */
export async function sendOrderConfirmationEmail(orderDetails, customerDetails) {
  console.log(`📧 Enviando instrucciones de transferencia ${orderDetails.order_number} a ${customerDetails.email}`);
  
  try {
    const { getBankTransferEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getBankTransferEmailTemplate(orderDetails, customerDetails);
    const subject = `Instrucciones de Pago - Pedido #${orderDetails.order_number}`;
    
    return await sendEmail({
      to: customerDetails.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando email de confirmación de pedido:', error);
    throw error;
  }
}
// AGREGAR ESTAS FUNCIONES AL FINAL DE TU emailService.js

/**
 * Función para enviar confirmación de pedido
 */
export async function sendOrderConfirmationOnlyEmail(orderDetails, customerDetails) {
  console.log(`📧 Enviando confirmación de pedido ${orderDetails.order_number} a ${customerDetails.email}`);
  
  try {
    const { getOrderConfirmationEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getOrderConfirmationEmailTemplate(orderDetails, customerDetails);
    const subject = `Confirmación de Pedido #${orderDetails.order_number}`;
    
    return await sendEmail({
      to: customerDetails.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando confirmación de pedido:', error);
    throw error;
  }
}

/**
 * Función para enviar actualización de estado
 */
export async function sendStatusUpdateEmail(order, customMessage) {
  console.log(`📧 Enviando actualización de estado ${order.order_number} a ${order.customer_email}`);
  
  try {
    const { getStatusUpdateEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getStatusUpdateEmailTemplate(order, customMessage);
    const subject = `Actualización de tu pedido #${order.order_number}`;
    
    return await sendEmail({
      to: order.customer_email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando actualización de estado:', error);
    throw error;
  }
}

/**
 * Función para enviar confirmación de pago
 */
export async function sendPaymentConfirmationEmail(order) {
  console.log(`📧 Enviando confirmación de pago ${order.order_number} a ${order.customer_email}`);
  
  try {
    const { getPaymentConfirmationEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getPaymentConfirmationEmailTemplate(order);
    const subject = `Pago confirmado - Pedido #${order.order_number}`;
    
    return await sendEmail({
      to: order.customer_email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando confirmación de pago:', error);
    throw error;
  }
}

/**
 * Función para enviar notificación de envío
 */
export async function sendShippedNotificationEmail(order, trackingInfo) {
  console.log(`📧 Enviando notificación de envío ${order.order_number} a ${order.customer_email}`);
  
  try {
    const { getShippedEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getShippedEmailTemplate(order, trackingInfo);
    const subject = `Tu pedido #${order.order_number} está en camino`;
    
    return await sendEmail({
      to: order.customer_email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando notificación de envío:', error);
    throw error;
  }
}

/**
 * Función para enviar notificación de entrega
 */
export async function sendDeliveredNotificationEmail(order) {
  console.log(`📧 Enviando notificación de entrega ${order.order_number} a ${order.customer_email}`);
  
  try {
    const { getDeliveredEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getDeliveredEmailTemplate(order);
    const subject = `Tu pedido #${order.order_number} ha sido entregado`;
    
    return await sendEmail({
      to: order.customer_email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando notificación de entrega:', error);
    throw error;
  }
}

/**
 * Función para enviar email personalizado
 */
export async function sendCustomEmail(order, customMessage, customSubject, customerName) {
  console.log(`📧 Enviando email personalizado ${order.order_number} a ${order.customer_email}`);
  
  try {
    const { getCustomEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getCustomEmailTemplate(order, customMessage, customerName);
    
    return await sendEmail({
      to: order.customer_email,
      subject: customSubject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando email personalizado:', error);
    throw error;
  }
}

/**
 * Función para enviar email al administrador cuando llega un nuevo mensaje de contacto
 */
export async function sendContactFormAdminEmail(contactData, messageId) {
  console.log(`📧 Enviando notificación admin para mensaje MSG-${messageId}`);
  
  try {
    const { getContactFormAdminEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getContactFormAdminEmailTemplate(contactData, messageId);
    
    // Determinar prioridad del asunto
    const priorityPrefix = contactData.type === 'business' ? '[COMERCIAL] ' : 
                          contactData.type === 'support' ? '[SOPORTE] ' : '';
    
    const subject = `💌 ${priorityPrefix}Nuevo mensaje de ${contactData.name} - MSG-${messageId}`;
    
    const adminEmail = process.env.ADMIN_EMAIL || 
                      process.env.CONTACT_EMAIL || 
                      'contacto@judaicabreslovcolombia.com';
    
    return await sendEmail({
      to: adminEmail,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando notificación admin de contacto:', error);
    throw error;
  }
}

/**
 * Función para enviar email de confirmación al usuario que envió el mensaje
 */
export async function sendContactConfirmationEmail(contactData, messageId) {
  console.log(`📧 Enviando confirmación de contacto MSG-${messageId} a ${contactData.email}`);
  
  try {
    const { getContactConfirmationEmailTemplate } = await import('./emailTemplates.js');
    
    const html = getContactConfirmationEmailTemplate(contactData, messageId);
    const subject = '✅ Hemos recibido tu mensaje - Judaica Breslov Colombia';
    
    return await sendEmail({
      to: contactData.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando confirmación de contacto:', error);
    throw error;
  }
}

/**
 * Función para enviar respuesta a un mensaje de contacto
 */
export async function sendContactResponseEmail(contactData, responseMessage, adminName, messageId) {
  console.log(`📧 Enviando respuesta de contacto MSG-${messageId} a ${contactData.email}`);
  
  try {
    // Crear plantilla simple para respuesta (puedes hacerla más elaborada después)
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <title>Respuesta a tu mensaje</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #1e3a8a, #3730a3); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .response-box { background: #f0f9ff; border-left: 4px solid #3730a3; padding: 15px; margin: 20px 0; border-radius: 6px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>📧 Respuesta a tu mensaje</h1>
                  <p>Judaica Breslov Colombia</p>
              </div>
              <div class="content">
                  <h2>Hola ${contactData.name},</h2>
                  <p>Hemos revisado tu mensaje (Ref: MSG-${messageId}) y queremos responderte:</p>
                  <div class="response-box">
                      <h3>💬 Respuesta de ${adminName || 'Nuestro Equipo'}</h3>
                      <div style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 6px;">
${responseMessage}
                      </div>
                  </div>
                  <p>Si tienes más preguntas, no dudes en contactarnos.</p>
                  <p>📱 WhatsApp: +57 300 929 1156<br>
                  📧 Email: contacto@judaicabreslovcolombia.com</p>
                  <p><strong>Atentamente,<br>${adminName || 'Equipo de Judaica Breslov Colombia'}</strong></p>
              </div>
          </div>
      </body>
      </html>
    `;
    
    const subject = `Re: ${contactData.subject || 'Tu consulta'} - MSG-${messageId}`;
    
    return await sendEmail({
      to: contactData.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando respuesta de contacto:', error);
    throw error;
  }
}
/**
 * Función para enviar email de bienvenida al newsletter
 */
export async function sendNewsletterWelcomeEmail(subscriberData) {
  console.log(`📧 Enviando bienvenida de newsletter a ${subscriberData.email}`);
  
  try {
    const { getNewsletterWelcomeTemplate } = await import('./emailTemplates.js');
    
    const html = getNewsletterWelcomeTemplate(subscriberData);
    const subject = '🎉 ¡Bienvenido al Newsletter de Judaica Breslov Colombia!';
    
    return await sendEmail({
      to: subscriberData.email,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando bienvenida de newsletter:', error);
    throw error;
  }
}

/**
 * Función para notificar al admin sobre nueva suscripción
 */
export async function sendNewsletterAdminNotification(subscriberData) {
  console.log(`📧 Enviando notificación admin para suscripción de ${subscriberData.email}`);
  
  try {
    const { getNewsletterAdminTemplate } = await import('./emailTemplates.js');
    
    const html = getNewsletterAdminTemplate(subscriberData);
    const subject = '📬 Nueva Suscripción al Newsletter';
    
    const adminEmail = process.env.ADMIN_EMAIL || 
                      process.env.CONTACT_EMAIL || 
                      'contacto@judaicabreslovcolombia.com';
    
    return await sendEmail({
      to: adminEmail,
      subject: subject,
      html: html
    });
    
  } catch (error) {
    console.error('❌ Error enviando notificación admin de newsletter:', error);
    throw error;
  }
}


/**
 * Función para guardar suscriptor en BD y enviar emails
 */
export async function subscribeToNewsletter(subscriberData) {
  console.log(`📧 Procesando suscripción de newsletter para ${subscriberData.email}`);
  
  try {
    const { query, queryOne } = await import('./database.js');
    const { email, name = '', source = 'footer' } = subscriberData;

    // Verificar si ya existe el email
    const existingSubscriber = await queryOne(
      'SELECT id, status FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        return {
          success: false,
          message: 'Ya estás suscrito a nuestro newsletter.',
          alreadySubscribed: true
        };
      } else {
        // Reactivar suscripción si estaba inactiva o desuscrita
        await query(
          'UPDATE newsletter_subscribers SET status = ?, name = ?, source = ?, subscribed_at = NOW(), unsubscribed_at = NULL, updated_at = NOW() WHERE email = ?',
          ['active', name, source, email]
        );
        console.log(`✅ Suscriptor reactivado: ${email}`);
      }
    } else {
      // Crear nuevo suscriptor
      await query(
        'INSERT INTO newsletter_subscribers (email, name, source, status, subscribed_at) VALUES (?, ?, ?, ?, NOW())',
        [email, name, source, 'active']
      );
      console.log(`✅ Nuevo suscriptor creado: ${email}`);
    }

    // Enviar emails de bienvenida y notificación
    const emailResults = await Promise.allSettled([
      sendNewsletterWelcomeEmail(subscriberData),
      sendNewsletterAdminNotification(subscriberData)
    ]);

    const welcomeEmailSent = emailResults[0].status === 'fulfilled';
    const adminEmailSent = emailResults[1].status === 'fulfilled';

    if (!welcomeEmailSent) {
      console.warn('⚠️ Error enviando email de bienvenida:', emailResults[0].reason);
    }
    if (!adminEmailSent) {
      console.warn('⚠️ Error enviando notificación al admin:', emailResults[1].reason);
    }

    return {
      success: true,
      message: '¡Suscripción exitosa! Revisa tu email para la confirmación.',
      emailSent: welcomeEmailSent,
      isReactivation: !!existingSubscriber
    };

  } catch (error) {
    console.error('❌ Error en suscripción de newsletter:', error);
    throw error;
  }
}

/**
 * Función para desuscribirse del newsletter
 */
export async function unsubscribeFromNewsletter(email) {
  console.log(`📧 Procesando desuscripción de newsletter para ${email}`);
  
  try {
    const { query, queryOne } = await import('./database.js');

    // Verificar si existe el suscriptor
    const subscriber = await queryOne(
      'SELECT id, status FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    if (!subscriber) {
      return {
        success: false,
        message: 'Email no encontrado en nuestra lista de suscriptores.'
      };
    }

    if (subscriber.status === 'unsubscribed') {
      return {
        success: false,
        message: 'Ya estás desuscrito de nuestro newsletter.'
      };
    }

    // Marcar como desuscrito
    await query(
      'UPDATE newsletter_subscribers SET status = ?, unsubscribed_at = NOW(), updated_at = NOW() WHERE email = ?',
      ['unsubscribed', email]
    );

    console.log(`✅ Suscriptor desuscrito: ${email}`);

    return {
      success: true,
      message: 'Te has desuscrito exitosamente del newsletter.'
    };

  } catch (error) {
    console.error('❌ Error en desuscripción de newsletter:', error);
    throw error;
  }
}

/**
 * Función para obtener estadísticas del newsletter
 */
export async function getNewsletterStats() {
  try {
    const { query } = await import('./database.js');

    const stats = await query(`
      SELECT 
        COUNT(*) as total_subscribers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_subscribers,
        SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) as unsubscribed,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN DATE(subscribed_at) = CURDATE() THEN 1 ELSE 0 END) as today_subscriptions,
        SUM(CASE WHEN DATE(subscribed_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_subscriptions,
        SUM(CASE WHEN DATE(subscribed_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as month_subscriptions
      FROM newsletter_subscribers
    `);

    return stats[0];
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de newsletter:', error);
    throw error;
  }
}