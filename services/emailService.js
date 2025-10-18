// services/emailService.js
// Centraliza la configuración de Nodemailer y la lógica de envío.

import nodemailer from 'nodemailer';

// Configura el transportador de Nodemailer usando los detalles SMTP de las variables de entorno
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT === '465', // true para puerto 465 (SSL/TLS), false para otros (ej. 587 con STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // IMPORTANTE: En producción, `rejectUnauthorized` debería ser `true` para validar certificados.
    // Solo ponlo en `false` en desarrollo si tienes problemas de certificados autofirmados.
    rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
  },
});

// Prueba la conexión con el servidor SMTP al iniciar el servicio (opcional, pero buena práctica)
// Se ejecutará una vez cuando el módulo sea importado por primera vez en el servidor.
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Falló la conexión SMTP de Nodemailer:', error.message);
    // Puedes considerar una estrategia de reintento o alerta aquí en producción
  } else {
    console.log('✅ Conexión SMTP de Nodemailer exitosa. El servidor está listo para recibir nuestros mensajes.');
  }
});

/**
 * Función genérica para enviar un correo electrónico.
 * Es el único punto para enviar correos en tu aplicación.
 * @param {object} options - Opciones del correo.
 * @param {string} options.to - Dirección(es) de correo electrónico del destinatario.
 * @param {string} options.subject - Asunto del correo electrónico.
 * @param {string} options.html - Contenido HTML del cuerpo del correo.
 * @param {string} [options.text] - Contenido de texto plano (opcional).
 * @param {string} [options.from] - Dirección de correo electrónico del remitente. Por defecto es SMTP_USER.
 */
export const sendEmail = async ({ to, subject, html, text, from = process.env.SMTP_USER }) => {
  if (!to || !subject || !html) {
    throw new Error('Se requiere el destinatario ("to"), el asunto ("subject") y el contenido HTML ("html") del correo.');
  }

  try {
    const mailOptions = {
      from: `"${process.env.SITE_NAME || 'Judaica Breslov Colombia'}" <${from}>`, // Asegúrate que SITE_NAME esté en .env
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback: eliminar etiquetas HTML si no se proporciona texto plano
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Correo enviado: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando correo a %s:', to, error);
    // En desarrollo, puedes optar por no lanzar el error para no detener el flujo de la aplicación
    // si el envío de correo no es crítico para la funcionalidad principal.
    if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Email falló en desarrollo, pero continuando el proceso principal...');
        return { success: false, error: error.message, message: 'Email failed to send in development mode.' };
    }
    throw new Error(`Fallo al enviar el correo electrónico: ${error.message}`);
  }
};

/**
 * Función de prueba para verificar la conexión SMTP.
 * Se puede exportar y llamar desde una API de prueba, por ejemplo.
 */
export async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ Configuración de email SMTP válida');
    return { success: true };
  } catch (error) {
    console.error('❌ Error en configuración de email SMTP:', error);
    return { success: false, error: error.message };
  }
}