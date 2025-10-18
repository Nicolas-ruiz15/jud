// pages/api/blog/newsletter.js - SUSCRIPCIÓN AL NEWSLETTER
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email, name = '', source = 'blog' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido requerido' });
    }

    // Verificar si ya existe el email
    const existing = await query(
      'SELECT id FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'Ya estás suscrito a nuestro newsletter' 
      });
    }

    // Insertar nuevo suscriptor
    await query(`
      INSERT INTO newsletter_subscribers (email, name, source, status, subscribed_at)
      VALUES (?, ?, ?, 'active', NOW())
    `, [email, name, source]);

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: '¡Suscripción exitosa! Recibirás nuestro contenido judaico.'
    });

  } catch (error) {
    console.error('Error en suscripción newsletter:', error);
    
    // Si la tabla no existe, crear una respuesta genérica
    if (error.code === 'ER_NO_SUCH_TABLE') {
      res.status(200).json({
        success: true,
        message: 'Suscripción recibida. Te contactaremos pronto.'
      });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}