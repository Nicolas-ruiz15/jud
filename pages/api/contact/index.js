// pages/api/contact.js - VERSION MEJORADA CON EMAIL SERVICE
import { query } from '../../../lib/database';
import { sendContactFormAdminEmail, sendContactConfirmationEmail } from '../../../lib/emailService';

export default async function handler(req, res) {
  console.log('🚀 API de contacto iniciada');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { name, email, phone, subject, message, type } = req.body;
    
    console.log('📝 Datos recibidos:', { name, email, type });

    // Validaciones básicas
    if (!name || !email || !message) {
      console.log('❌ Validación fallida');
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y mensaje son requeridos'
      });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      console.log('❌ Email inválido');
      return res.status(400).json({
        success: false,
        message: 'Email no válido'
      });
    }

    console.log('✅ Validaciones pasadas');

    // Intentar guardar en base de datos
    console.log('💾 Intentando guardar en BD...');
    
    const contactResult = await query(`
      INSERT INTO contact_messages (
        name, 
        email, 
        phone, 
        subject, 
        message, 
        type, 
        status, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `, [
      name, 
      email, 
      phone || null, 
      subject || null, 
      message, 
      type || 'general'
    ]);

    const messageId = contactResult.insertId;
    console.log('✅ Mensaje guardado en BD con ID:', messageId);

    // Enviar emails usando el servicio
    console.log('📧 Enviando emails...');
    
    try {
      // Email al administrador
      console.log('📧 Enviando email al administrador...');
      await sendContactFormAdminEmail(req.body, messageId);
      console.log('✅ Email enviado al administrador');

      // Email de confirmación al usuario
      console.log('📧 Enviando email de confirmación...');
      await sendContactConfirmationEmail(req.body, messageId);
      console.log('✅ Email de confirmación enviado');

    } catch (emailError) {
      console.error('❌ Error con email:', emailError.message);
      // No fallar la API si hay problemas con email en desarrollo
      if (process.env.NODE_ENV === 'production') {
        throw emailError;
      }
    }

    // Actualizar estado
    await query(`
      UPDATE contact_messages 
      SET status = 'sent', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [messageId]);

    console.log('✅ Estado actualizado');

    res.status(200).json({
      success: true,
      message: 'Mensaje enviado exitosamente! Te responderemos pronto.',
      data: {
        id: messageId,
        type: type || 'general',
        reference: `MSG-${messageId}`
      }
    });

  } catch (error) {
    console.error('💥 ERROR COMPLETO:', error);
    console.error('💥 ERROR MESSAGE:', error.message);
    console.error('💥 ERROR STACK:', error.stack);
    
    res.status(500).json({
      success: false,
      message: `Error del servidor: ${error.message}`,
      debug: process.env.NODE_ENV === 'development' ? {
        error: error.message,
        stack: error.stack
      } : undefined
    });
  }
}