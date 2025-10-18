// pages/api/blog/increment-views.js - INCREMENTAR VISTAS DE ARTÍCULOS
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'ID del post requerido' });
    }

    // Incrementar contador de vistas
    await query(
      'UPDATE blog_posts SET views_count = views_count + 1 WHERE id = ?',
      [postId]
    );

    // Obtener el nuevo conteo
    const [result] = await query(
      'SELECT views_count FROM blog_posts WHERE id = ?',
      [postId]
    );

    res.status(200).json({ 
      success: true, 
      views: result?.views_count || 0 
    });

  } catch (error) {
    console.error('Error incrementando vistas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}