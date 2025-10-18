// pages/api/products/[slug].js
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
    // Obtener producto principal
    const productResult = await query(`
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT pi.image_url ORDER BY pi.sort_order) as image_urls,
        GROUP_CONCAT(DISTINCT pi.alt_text ORDER BY pi.sort_order) as image_alts,
        GROUP_CONCAT(DISTINCT pi.is_featured ORDER BY pi.sort_order) as image_featured
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.slug = ? AND p.status = 'active'
      GROUP BY p.id
    `, [slug]);

    if (productResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const product = productResult[0];

    // Obtener categorías del producto
    const categoriesResult = await query(`
      SELECT c.id, c.name, c.slug
      FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ?
    `, [product.id]);

    // Procesar imágenes
    const images = [];
    if (product.image_urls) {
      const urls = product.image_urls.split(',');
      const alts = product.image_alts ? product.image_alts.split(',') : [];
      const featured = product.image_featured ? product.image_featured.split(',') : [];

      for (let i = 0; i < urls.length; i++) {
        images.push({
          image_url: urls[i],
          alt_text: alts[i] || product.name,
          is_featured: featured[i] === '1'
        });
      }
    }

    // ✅ ESTRUCTURA FINAL DEL PRODUCTO SIN STOCK_QUANTITY NI MANAGE_STOCK
    const productData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description,
      price: parseFloat(product.price),
      sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
      sku: product.sku,
      // ❌ ELIMINADAS LAS SIGUIENTES LÍNEAS PARA NO MOSTRAR NÚMEROS DE STOCK:
      // stock_quantity: product.stock_quantity,
      // manage_stock: product.manage_stock,
      stock_status: product.stock_status,  // ✅ SOLO MANTENER EL STATUS (in_stock/out_of_stock)
      weight: product.weight,
      dimensions: product.dimensions,
      featured: product.featured,
      status: product.status,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      woocommerce_id: product.woocommerce_id,
      created_at: product.created_at,
      updated_at: product.updated_at,
      categories: categoriesResult,
      images: images
    };

    res.status(200).json({
      success: true,
      data: productData
    });

  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}