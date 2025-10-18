// pages/api/admin/products/index.js
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return await getProducts(req, res);
    case 'POST':
      return await createProduct(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
}

async function getProducts(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      stock_status,
      include_images = 'false',
      include_categories = 'false'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    // Filtros
    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (stock_status) {
      if (stock_status === 'low_stock') {
        conditions.push('p.manage_stock = true AND p.stock_quantity <= 5');
      } else {
        conditions.push('p.stock_status = ?');
        params.push(stock_status);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    // Obtener productos
    let productsQuery = `
      SELECT p.*
      ${include_images === 'true' ? ', pi.image_url as featured_image, pi.alt_text as image_alt' : ''}
      FROM products p
      ${include_images === 'true' ? 'LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = 1' : ''}
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = await query(productsQuery, [...params, parseInt(limit), offset]);

    // Calcular paginación
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: products,
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
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function createProduct(req, res) {
  try {
    const {
      name,
      slug,
      description,
      short_description,
      price,
      sale_price,
      sku,
      stock_quantity,
      manage_stock,
      stock_status,
      weight,
      dimensions,
      featured,
      status,
      meta_title,
      meta_description
    } = req.body;

    // Validaciones básicas
    if (!name || !slug || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, slug y precio son requeridos'
      });
    }

    // Crear producto
    const result = await query(`
      INSERT INTO products (
        name, slug, description, short_description, price, sale_price, sku,
        stock_quantity, manage_stock, stock_status, weight, dimensions,
        featured, status, meta_title, meta_description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name, slug, description, short_description, parseFloat(price),
      sale_price ? parseFloat(sale_price) : null, sku,
      manage_stock ? parseInt(stock_quantity) || 0 : 0,
      manage_stock, stock_status, weight, dimensions,
      featured, status, meta_title, meta_description
    ]);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { id: result.insertId }
    });
	  try {
  await res.revalidate('/');
  await res.revalidate('/productos');
} catch (revalidateError) {
  console.warn('Error revalidating after create:', revalidateError);
}

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export default adminAuth(handler);