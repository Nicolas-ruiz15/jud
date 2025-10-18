// pages/api/test/email-test.js
import { sendEmail } from '@/lib/emailService';

export default async function handler(req, res) {
  try {
    const result = await sendEmail({
      to: process.env.TEST_EMAIL || process.env.SMTP_USER,
      subject: 'Prueba de envío SMTP',
      html: `<p>Hola 👋,</p>
             <p>Este es un correo de <strong>prueba</strong> desde el servidor.</p>`,
      text: 'Hola, este es un correo de prueba desde el servidor.',
    });

    if (result.success) {
      return res.status(200).json({
        message: 'Correo enviado correctamente',
        info: result.info,
      });
    } else {
      return res.status(500).json({
        message: 'Error al enviar correo',
        error: result.error.message || result.error,
      });
    }
  } catch (error) {
    console.error('Error en API de prueba:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error });
  }
}
