// pages/api/admin/categories/index.js
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return await getCategories(req, res);
    case 'POST':
      return await createCategory(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
}

async function getCategories(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      parent_id,
      status,
      featured,
      include_children = 'false',
      include_products = 'false',
      sort = 'sort_order',
      order = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    // Filtros
    if (search) {
      conditions.push('(c.name LIKE ? OR c.description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (parent_id !== undefined) {
      if (parent_id === 'null' || parent_id === '') {
        conditions.push('c.parent_id IS NULL');
      } else {
        conditions.push('c.parent_id = ?');
        params.push(parseInt(parent_id));
      }
    }

    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }

    if (featured !== undefined) {
      conditions.push('c.featured = ?');
      params.push(featured === 'true' ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM categories c ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    // Obtener categorías
    let categoriesQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count,
        COUNT(DISTINCT children.id) as children_count,
        parent.name as parent_name,
        parent.slug as parent_slug
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      LEFT JOIN categories children ON c.id = children.parent_id
      LEFT JOIN categories parent ON c.parent_id = parent.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.${sort} ${order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const categories = await query(categoriesQuery, [...params, parseInt(limit), offset]);

    // Obtener hijos si se solicita
    if (include_children === 'true') {
      for (let category of categories) {
        const children = await query(
          `SELECT 
            c.*,
            COUNT(DISTINCT pc.product_id) as product_count
           FROM categories c
           LEFT JOIN product_categories pc ON c.id = pc.category_id
           LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
           WHERE c.parent_id = ?
           GROUP BY c.id
           ORDER BY c.sort_order ASC, c.name ASC`,
          [category.id]
        );
        category.children = children;
      }
    }

    // Formatear respuesta
    const formattedCategories = categories.map(cat => ({
      ...cat,
      featured: Boolean(cat.featured),
      product_count: parseInt(cat.product_count) || 0,
      children_count: parseInt(cat.children_count) || 0,
      has_children: parseInt(cat.children_count) > 0,
      hierarchy_level: cat.parent_id ? 1 : 0 // Calculado simplificado
    }));

    // Calcular paginación
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: formattedCategories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function createCategory(req, res) {
  try {
    const {
      name,
      slug,
      description,
      parent_id,
      image_url,
      icon,
      meta_title,
      meta_description,
      featured = false,
      status = 'active',
      color,
      sort_order = 0
    } = req.body;

    // Validaciones básicas
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y slug son requeridos'
      });
    }

    // Verificar slug único
    const existingSlug = await query(
      'SELECT id FROM categories WHERE slug = ?',
      [slug]
    );

    if (existingSlug.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El slug ya existe'
      });
    }

    // Verificar categoría padre existe (si se especifica)
    if (parent_id) {
      const parentCategory = await query(
        'SELECT id FROM categories WHERE id = ?',
        [parent_id]
      );

      if (parentCategory.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La categoría padre no existe'
        });
      }
    }

    // Crear categoría
    const result = await query(`
      INSERT INTO categories (
        name, slug, description, parent_id, image_url, icon,
        meta_title, meta_description, featured, status, color,
        sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name, slug, description, parent_id || null, image_url || null, icon || null,
      meta_title || null, meta_description || null, featured ? 1 : 0,
      status, color || null, parseInt(sort_order) || 0
    ]);

    // Obtener categoría creada con datos completos
    const newCategory = await query(`
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count,
        parent.name as parent_name
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        ...newCategory[0],
        featured: Boolean(newCategory[0].featured),
        product_count: parseInt(newCategory[0].product_count) || 0
      }
    });

  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export default adminAuth(handler);