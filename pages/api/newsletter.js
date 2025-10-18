import { subscribeToNewsletter } from '../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { email, name } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email válido es requerido' 
      });
    }

    const result = await subscribeToNewsletter({
      email: email.trim().toLowerCase(),
      name: name?.trim() || '',
      source: 'footer'
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error en API newsletter:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error procesando suscripción. Inténtalo de nuevo.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}