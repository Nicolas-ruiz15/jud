// pages/api/admin/categories/hierarchy.js
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { 
      include_products = 'false',
      include_inactive = 'false',
      max_depth = '3'
    } = req.query;

    // Obtener todas las categorías padre
    let parentConditions = 'c.parent_id IS NULL';
    if (include_inactive === 'false') {
      parentConditions += ' AND c.status = "active"';
    }

    const parentCategories = await query(`
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count,
        COUNT(DISTINCT children.id) as children_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      LEFT JOIN categories children ON c.id = children.parent_id
      WHERE ${parentConditions}
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `);

    // Construir jerarquía completa
    const hierarchy = await Promise.all(
      parentCategories.map(async (parent) => {
        const parentData = {
          ...parent,
          featured: Boolean(parent.featured),
          product_count: parseInt(parent.product_count) || 0,
          children_count: parseInt(parent.children_count) || 0,
          level: 0,
          children: []
        };

        if (parseInt(max_depth) > 0) {
          parentData.children = await getChildrenRecursive(
            parent.id, 
            1, 
            parseInt(max_depth),
            include_products === 'true',
            include_inactive === 'true'
          );
        }

        return parentData;
      })
    );

    // Obtener estadísticas de la jerarquía
    const stats = await getHierarchyStats();

    res.status(200).json({
      success: true,
      data: {
        hierarchy,
        stats,
        total_categories: hierarchy.reduce((total, parent) => 
          total + 1 + countChildrenRecursive(parent), 0
        )
      }
    });

  } catch (error) {
    console.error('Error obteniendo jerarquía de categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function getChildrenRecursive(parentId, currentLevel, maxDepth, includeProducts, includeInactive) {
  if (currentLevel >= maxDepth) {
    return [];
  }

  let childConditions = 'c.parent_id = ?';
  const params = [parentId];

  if (!includeInactive) {
    childConditions += ' AND c.status = "active"';
  }

  const children = await query(`
    SELECT 
      c.*,
      COUNT(DISTINCT pc.product_id) as product_count,
      COUNT(DISTINCT grandchildren.id) as children_count
    FROM categories c
    LEFT JOIN product_categories pc ON c.id = pc.category_id
    LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
    LEFT JOIN categories grandchildren ON c.id = grandchildren.parent_id
    WHERE ${childConditions}
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `, params);

  return await Promise.all(
    children.map(async (child) => {
      const childData = {
        ...child,
        featured: Boolean(child.featured),
        product_count: parseInt(child.product_count) || 0,
        children_count: parseInt(child.children_count) || 0,
        level: currentLevel,
        children: []
      };

      // Obtener productos si se solicita
      if (includeProducts && childData.product_count > 0) {
        const products = await query(`
          SELECT 
            p.id, p.name, p.slug, p.price, p.status,
            pi.image_url as featured_image
          FROM products p
          INNER JOIN product_categories pc ON p.id = pc.product_id
          LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = 1
          WHERE pc.category_id = ? AND p.status = 'active'
          ORDER BY p.name ASC
          LIMIT 5
        `, [child.id]);

        childData.sample_products = products;
      }

      // Continuar con los hijos si no hemos alcanzado la profundidad máxima
      if (currentLevel < maxDepth - 1 && childData.children_count > 0) {
        childData.children = await getChildrenRecursive(
          child.id,
          currentLevel + 1,
          maxDepth,
          includeProducts,
          includeInactive
        );
      }

      return childData;
    })
  );
}

async function getHierarchyStats() {
  const [
    depthStats,
    orphanStats,
    popularStats
  ] = await Promise.all([
    // Estadísticas de profundidad
    query(`
      WITH RECURSIVE category_hierarchy AS (
        SELECT id, parent_id, name, 0 as depth
        FROM categories
        WHERE parent_id IS NULL
        
        UNION ALL
        
        SELECT c.id, c.parent_id, c.name, ch.depth + 1
        FROM categories c
        INNER JOIN category_hierarchy ch ON c.parent_id = ch.id
        WHERE ch.depth < 10
      )
      SELECT 
        depth,
        COUNT(*) as count
      FROM category_hierarchy
      GROUP BY depth
      ORDER BY depth
    `),

    // Categorías huérfanas (sin productos ni hijos)
    query(`
      SELECT COUNT(*) as orphan_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN categories children ON c.id = children.parent_id
      WHERE pc.category_id IS NULL AND children.parent_id IS NULL
    `),

    // Categorías más populares por nivel
    query(`
      SELECT 
        CASE 
          WHEN c.parent_id IS NULL THEN 'level_0'
          ELSE 'level_1+'
        END as category_level,
        COUNT(DISTINCT pc.product_id) as total_products
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      GROUP BY category_level
    `)
  ]);

  return {
    depth_distribution: depthStats,
    orphan_categories: orphanStats[0]?.orphan_count || 0,
    products_by_level: popularStats.reduce((acc, stat) => {
      acc[stat.category_level] = stat.total_products || 0;
      return acc;
    }, {}),
    max_depth: Math.max(...depthStats.map(s => s.depth), 0),
    total_levels: depthStats.length
  };
}

function countChildrenRecursive(category) {
  if (!category.children || category.children.length === 0) {
    return 0;
  }

  return category.children.reduce((count, child) => 
    count + 1 + countChildrenRecursive(child), 0
  );
}

export default adminAuth(handler);