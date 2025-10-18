import { unsubscribeFromNewsletter } from '../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email válido es requerido' 
      });
    }

    const result = await unsubscribeFromNewsletter(email.trim().toLowerCase());
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error en API unsubscribe:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error procesando desuscripción. Inténtalo de nuevo.'
    });
  }
}