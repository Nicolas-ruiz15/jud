// pages/api/blog/stats.js - ESTADÍSTICAS DEL BLOG
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Estadísticas generales
    const [stats] = await query(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(views_count) as total_views,
        AVG(reading_time) as avg_reading_time,
        COUNT(CASE WHEN featured = 1 THEN 1 END) as featured_posts
      FROM blog_posts 
      WHERE status = 'published'
    `);

    // Posts más leídos
    const popularPosts = await query(`
      SELECT id, title, slug, views_count
      FROM blog_posts 
      WHERE status = 'published'
      ORDER BY views_count DESC
      LIMIT 5
    `);

    // Categorías con más posts
    const topCategories = await query(`
      SELECT 
        bc.name,
        bc.slug,
        COUNT(bp.id) as post_count
      FROM blog_categories bc
      LEFT JOIN blog_posts bp ON bc.id = bp.category_id AND bp.status = 'published'
      WHERE bc.status = 'active'
      GROUP BY bc.id
      ORDER BY post_count DESC
      LIMIT 5
    `);

    // Posts recientes
    const recentPosts = await query(`
      SELECT id, title, slug, published_at, views_count
      FROM blog_posts 
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      data: {
        general: stats,
        popularPosts,
        topCategories,
        recentPosts
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}