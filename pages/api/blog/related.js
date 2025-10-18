import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { postId, categoryId, limit = 4 } = req.query;

    if (!postId) {
      return res.status(400).json({ error: 'ID del post requerido' });
    }

    let relatedPosts = [];

    // Primero buscar por categoría
    if (categoryId) {
      relatedPosts = await query(`
        SELECT 
          bp.*,
          bc.name as category_name,
          bc.slug as category_slug,
          bc.color as category_color
        FROM blog_posts bp
        LEFT JOIN blog_categories bc ON bp.category_id = bc.id
        WHERE bp.category_id = ? 
          AND bp.id != ? 
          AND bp.status = 'published' 
          AND bp.published_at <= NOW()
        ORDER BY bp.featured DESC, bp.published_at DESC
        LIMIT ?
      `, [categoryId, postId, parseInt(limit)]);
    }

    // Si no hay suficientes, buscar por tags similares
    if (relatedPosts.length < parseInt(limit)) {
      const remaining = parseInt(limit) - relatedPosts.length;
      const existingIds = relatedPosts.map(p => p.id);
      
      const tagRelated = await query(`
        SELECT DISTINCT
          bp.*,
          bc.name as category_name,
          bc.slug as category_slug,
          bc.color as category_color
        FROM blog_posts bp
        LEFT JOIN blog_categories bc ON bp.category_id = bc.id
        INNER JOIN blog_post_tags bpt1 ON bp.id = bpt1.post_id
        WHERE bpt1.tag_id IN (
          SELECT bpt2.tag_id 
          FROM blog_post_tags bpt2 
          WHERE bpt2.post_id = ?
        )
        AND bp.id != ?
        AND bp.id NOT IN (${existingIds.length > 0 ? existingIds.map(() => '?').join(',') : '0'})
        AND bp.status = 'published'
        AND bp.published_at <= NOW()
        ORDER BY bp.featured DESC, bp.published_at DESC
        LIMIT ?
      `, [postId, postId, ...existingIds, remaining]);

      relatedPosts = [...relatedPosts, ...tagRelated];
    }

    // Si aún no hay suficientes, obtener los más recientes
    if (relatedPosts.length < parseInt(limit)) {
      const remaining = parseInt(limit) - relatedPosts.length;
      const existingIds = relatedPosts.map(p => p.id);
      
      const recentPosts = await query(`
        SELECT 
          bp.*,
          bc.name as category_name,
          bc.slug as category_slug,
          bc.color as category_color
        FROM blog_posts bp
        LEFT JOIN blog_categories bc ON bp.category_id = bc.id
        WHERE bp.id != ?
          AND bp.id NOT IN (${existingIds.length > 0 ? existingIds.map(() => '?').join(',') : '0'})
          AND bp.status = 'published'
          AND bp.published_at <= NOW()
        ORDER BY bp.published_at DESC
        LIMIT ?
      `, [postId, ...existingIds, remaining]);

      relatedPosts = [...relatedPosts, ...recentPosts];
    }

    res.status(200).json({
      success: true,
      data: relatedPosts.slice(0, parseInt(limit))
    });

  } catch (error) {
    console.error('Error obteniendo artículos relacionados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}