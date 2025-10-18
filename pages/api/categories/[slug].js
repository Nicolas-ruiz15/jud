// pages/api/categories/[slug].js
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    // Obtener categoría principal
    const categoryResult = await query(`
      SELECT 
        c.*,
        COUNT(pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      WHERE c.slug = ?
      GROUP BY c.id
    `, [slug]);

    if (categoryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const category = categoryResult[0];

    // Obtener subcategorías si las hay
    const subcategoriesResult = await query(`
      SELECT 
        c.*,
        COUNT(pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      WHERE c.parent_id = ?
      GROUP BY c.id
      ORDER BY c.name ASC
    `, [category.id]);

    const categoryData = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parent_id: category.parent_id,
      meta_title: category.meta_title,
      meta_description: category.meta_description,
      woocommerce_id: category.woocommerce_id,
      created_at: category.created_at,
      updated_at: category.updated_at,
      product_count: category.product_count || 0,
      subcategories: subcategoriesResult.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        image: sub.image,
        product_count: sub.product_count || 0
      }))
    };

    res.status(200).json({
      success: true,
      data: categoryData
    });

  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}