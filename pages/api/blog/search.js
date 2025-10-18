import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { q, categoria, tag, page = 1, limit = 10 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereConditions = ['bp.status = "published"', 'bp.published_at <= NOW()'];
    let queryParams = [];

    // Búsqueda por texto
    if (q) {
      whereConditions.push('(bp.title LIKE ? OR bp.excerpt LIKE ? OR bp.content LIKE ?)');
      const searchPattern = `%${q}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Filtro por categoría
    if (categoria) {
      whereConditions.push('bc.slug = ?');
      queryParams.push(categoria);
    }

    // Filtro por tag
    if (tag) {
      whereConditions.push('EXISTS (SELECT 1 FROM blog_post_tags bpt INNER JOIN blog_tags bt ON bpt.tag_id = bt.id WHERE bpt.post_id = bp.id AND bt.slug = ?)');
      queryParams.push(tag);
    }

    const whereClause = whereConditions.join(' AND ');

    // Consulta principal
    const posts = await query(`
      SELECT 
        bp.*,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.color as category_color
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE ${whereClause}
      ORDER BY bp.featured DESC, bp.published_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    // Contar total
    const [countResult] = await query(`
      SELECT COUNT(*) as total
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE ${whereClause}
    `, queryParams);

    const total = countResult.total;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error en búsqueda del blog:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
