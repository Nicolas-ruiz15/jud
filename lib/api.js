// lib/api.js
import { query, queryOne } from './database';

// Función helper para serializar fechas
function serializeData(data) {
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  if (data && typeof data === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else if (value && typeof value === 'object') {
        serialized[key] = serializeData(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }
  
  return data;
}

// Obtener productos destacados con imágenes
export async function getFeaturedProducts(limit = 8) {
  try {
    const products = await query(
      `SELECT 
        p.*,
        pi.image_url as featured_image,
        pi.alt_text as image_alt,
        GROUP_CONCAT(c.name SEPARATOR ', ') as category_name,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND approved = true) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND approved = true) as review_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = true
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.status = 'active' AND p.featured = 1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ?`,
      [limit]
    );

    return serializeData(products || []);
  } catch (error) {
    console.error('Error obteniendo productos destacados:', error);
    return [];
  }
}

// Obtener categorías principales con imágenes
export async function getCategories(limit = 8) {
  try {
    const categories = await query(
      `SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      WHERE c.parent_id IS NULL
      GROUP BY c.id
      ORDER BY c.name ASC
      LIMIT ?`,
      [limit]
    );

    return serializeData(categories || []);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return [];
  }
}

// Obtener producto por slug con todas sus imágenes
export async function getProductBySlug(slug) {
  try {
    const product = await query(
      `SELECT 
        p.*,
        GROUP_CONCAT(c.name SEPARATOR ', ') as categories,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND approved = true) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND approved = true) as review_count
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.slug = ? AND p.status = 'active'
      GROUP BY p.id
      LIMIT 1`,
      [slug]
    );

    if (!product || product.length === 0) {
      return null;
    }

    // Obtener imágenes del producto
    const images = await query(
      'SELECT image_url, alt_text, is_featured, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [product[0].id]
    );

    // Obtener reseñas del producto
    const reviews = await query(
      'SELECT * FROM reviews WHERE product_id = ? AND approved = true ORDER BY created_at DESC',
      [product[0].id]
    );

    // Agregar imagen destacada al producto principal
    const featuredImage = images.find(img => img.is_featured) || images[0];
    
    const result = {
      ...product[0],
      featured_image: featuredImage?.image_url || null,
      image_alt: featuredImage?.alt_text || product[0].name,
      images: serializeData(images || []),
      reviews: serializeData(reviews || [])
    };

    return serializeData(result);
  } catch (error) {
    console.error('Error obteniendo producto por slug:', error);
    return null;
  }
}

// Obtener categoría por slug con imagen
export async function getCategoryBySlug(slug) {
  try {
    const category = await query(
      `SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      WHERE c.slug = ?
      GROUP BY c.id
      LIMIT 1`,
      [slug]
    );

    if (!category || category.length === 0) {
      return null;
    }

    return serializeData(category[0]);
  } catch (error) {
    console.error('Error obteniendo categoría por slug:', error);
    return null;
  }
}

// Obtener productos por categoría con imágenes
export async function getProductsByCategory(categorySlug, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;

    const products = await query(
      `SELECT 
        p.*,
        pi.image_url as featured_image,
        pi.alt_text as image_alt,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND approved = true) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND approved = true) as review_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = true
      JOIN product_categories pc ON p.id = pc.product_id
      JOIN categories c ON pc.category_id = c.id
      WHERE c.slug = ? AND p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [categorySlug, limit, offset]
    );

    // Contar total de productos
    const totalResult = await query(
      `SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      JOIN product_categories pc ON p.id = pc.product_id
      JOIN categories c ON pc.category_id = c.id
      WHERE c.slug = ? AND p.status = 'active'`,
      [categorySlug]
    );

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      products: serializeData(products || []),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error obteniendo productos por categoría:', error);
    return {
      products: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
}

// Buscar productos con imágenes
export async function searchProducts(searchTerm, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;

    const products = await query(
      `SELECT 
        p.*,
        pi.image_url as featured_image,
        pi.alt_text as image_alt,
        GROUP_CONCAT(c.name SEPARATOR ', ') as categories,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND approved = true) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND approved = true) as review_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = true
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.status = 'active' AND (
        p.name LIKE ? OR 
        p.description LIKE ? OR 
        p.short_description LIKE ? OR
        p.sku LIKE ?
      )
      GROUP BY p.id
      ORDER BY p.name ASC
      LIMIT ? OFFSET ?`,
      [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset]
    );

    // Contar total de resultados
    const totalResult = await query(
      `SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.status = 'active' AND (
        p.name LIKE ? OR 
        p.description LIKE ? OR 
        p.short_description LIKE ? OR
        p.sku LIKE ?
      )`,
      [searchPattern, searchPattern, searchPattern, searchPattern]
    );

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      products: serializeData(products || []),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error buscando productos:', error);
    return {
      products: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
}

// Obtener productos relacionados con imágenes
export async function getRelatedProducts(productId, categoryIds = [], limit = 4) {
  try {
    let queryStr = `
      SELECT DISTINCT
        p.*,
        pi.image_url as featured_image,
        pi.alt_text as image_alt,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND approved = true) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND approved = true) as review_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = true
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.status = 'active' AND p.id != ?
    `;

    const params = [productId];

    if (categoryIds.length > 0) {
      queryStr += ` AND pc.category_id IN (${categoryIds.map(() => '?').join(',')})`;
      params.push(...categoryIds);
    }

    queryStr += ` ORDER BY RAND() LIMIT ?`;
    params.push(limit);

    const products = await query(queryStr, params);
    return serializeData(products || []);
  } catch (error) {
    console.error('Error obteniendo productos relacionados:', error);
    return [];
  }
}

// Obtener productos más vendidos con imágenes
export async function getBestSellingProducts(limit = 5) {
  try {
    const products = await query(
      `SELECT 
        p.*,
        pi.image_url as featured_image,
        pi.alt_text as image_alt,
        SUM(oi.quantity) as total_sold
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = true
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE p.status = 'active' AND o.payment_status = 'completed'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT ?`,
      [limit]
    );

    return serializeData(products || []);
  } catch (error) {
    console.error('Error obteniendo productos más vendidos:', error);
    return [];
  }
}

// Obtener todas las categorías con imágenes (admin)
export async function getAllCategories() {
  try {
    const categories = await query(
      `SELECT 
        c.*,
        COUNT(pc.product_id) as product_count,
        parent.name as parent_name
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      GROUP BY c.id
      ORDER BY c.name ASC`
    );

    return serializeData(categories || []);
  } catch (error) {
    console.error('Error obteniendo todas las categorías:', error);
    return [];
  }
}

// Obtener estadísticas del dashboard
export async function getDashboardStats() {
  try {
    const stats = {};

    // Total de productos
    const productStats = await query(
      'SELECT COUNT(*) as total, SUM(featured = true) as featured FROM products WHERE status = "active"'
    );
    stats.products = productStats[0] || { total: 0, featured: 0 };

    // Total de categorías
    const categoryStats = await query('SELECT COUNT(*) as total FROM categories');
    stats.categories = categoryStats[0] || { total: 0 };

    // Órdenes recientes
    const orderStats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(total_amount) as total_revenue
      FROM orders 
      WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);
    stats.orders = orderStats[0] || { total: 0, pending: 0, processing: 0, completed: 0, total_revenue: 0 };

    // Usuarios registrados
    const userStats = await query(
      'SELECT COUNT(*) as total FROM users WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    );
    stats.users = userStats[0] || { total: 0 };

    return serializeData(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    return {
      products: { total: 0, featured: 0 },
      categories: { total: 0 },
      orders: { total: 0, pending: 0, processing: 0, completed: 0, total_revenue: 0 },
      users: { total: 0 }
    };
  }
}

// Obtener productos con bajo stock
export async function getLowStockProducts(threshold = 10) {
  try {
    const products = await query(
      `SELECT 
        p.*,
        pi.image_url as featured_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = true
      WHERE p.status = 'active' 
        AND p.manage_stock = true 
        AND p.stock_quantity <= ?
      ORDER BY p.stock_quantity ASC`,
      [threshold]
    );

    return serializeData(products || []);
  } catch (error) {
    console.error('Error obteniendo productos con bajo stock:', error);
    return [];
  }
}

// Obtener reseñas recientes
export async function getRecentReviews(limit = 10) {
  try {
    const reviews = await query(
      `SELECT 
        r.*,
        p.name as product_name,
        p.slug as product_slug
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.approved = true
      ORDER BY r.created_at DESC
      LIMIT ?`,
      [limit]
    );

    return serializeData(reviews || []);
  } catch (error) {
    console.error('Error obteniendo reseñas recientes:', error);
    return [];
  }
}

// Obtener configuraciones del sitio
export async function getSiteSettings() {
  try {
    const settings = await query('SELECT key_name, value, type FROM settings');
    
    const settingsObj = {};
    settings.forEach(setting => {
      let value = setting.value;
      
      // Convertir según el tipo
      switch (setting.type) {
        case 'number':
          value = parseFloat(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.error('Error parsing JSON setting:', setting.key_name);
          }
          break;
        default:
          // string - no conversion needed
          break;
      }
      
      settingsObj[setting.key_name] = value;
    });

    return serializeData(settingsObj);
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    return {};
  }
}

// Actualizar configuración del sitio
export async function updateSiteSetting(key, value, type = 'string') {
  try {
    let stringValue = value;
    
    // Convertir a string según el tipo
    if (type === 'json') {
      stringValue = JSON.stringify(value);
    } else if (type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else if (type === 'number') {
      stringValue = value.toString();
    }

    await query(
      `INSERT INTO settings (key_name, value, type) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       value = VALUES(value), 
       type = VALUES(type),
       updated_at = CURRENT_TIMESTAMP`,
      [key, stringValue, type]
    );

    return true;
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    return false;
  }
}

// Obtener páginas estáticas
export async function getPages() {
  try {
    const pages = await query(
      'SELECT * FROM pages WHERE status = "published" ORDER BY title ASC'
    );

    return serializeData(pages || []);
  } catch (error) {
    console.error('Error obteniendo páginas:', error);
    return [];
  }
}

// Obtener página por slug
export async function getPageBySlug(slug) {
  try {
    const page = await query(
      'SELECT * FROM pages WHERE slug = ? AND status = "published" LIMIT 1',
      [slug]
    );

    return serializeData(page[0] || null);
  } catch (error) {
    console.error('Error obteniendo página por slug:', error);
    return null;
  }
}

// Obtener posts del blog
export async function getBlogPosts(page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;

    const posts = await query(
      `SELECT 
        p.*,
        u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Contar total de posts
    const totalResult = await query(
      'SELECT COUNT(*) as total FROM posts WHERE status = "published"'
    );

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      posts: serializeData(posts || []),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error obteniendo posts del blog:', error);
    return {
      posts: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
}

// Obtener post por slug
export async function getBlogPostBySlug(slug) {
  try {
    const post = await query(
      `SELECT 
        p.*,
        u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.slug = ? AND p.status = 'published'
      LIMIT 1`,
      [slug]
    );

    return serializeData(post[0] || null);
  } catch (error) {
    console.error('Error obteniendo post por slug:', error);
    return null;
  }
}

// Obtener todos los productos (admin)
export async function getAllProducts(page = 1, limit = 20, filters = {}) {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // Aplicar filtros
    if (filters.status) {
      conditions.push('p.status = ?');
      params.push(filters.status);
    }

    if (filters.featured !== undefined) {
      conditions.push('p.featured = ?');
      params.push(filters.featured);
    }

    if (filters.category) {
      conditions.push('EXISTS (SELECT 1 FROM product_categories pc JOIN categories c ON pc.category_id = c.id WHERE pc.product_id = p.id AND c.slug = ?)');
      params.push(filters.category);
    }

    if (filters.search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const products = await query(
      `SELECT 
        p.*,
        pi.image_url as featured_image,
        GROUP_CONCAT(c.name SEPARATOR ', ') as categories
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = true
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Contar total
    const countParams = params.slice(0, -2);
    const totalResult = await query(
      `SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${whereClause}`,
      countParams
    );

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      products: serializeData(products || []),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error obteniendo todos los productos:', error);
    return {
      products: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
}

// Crear nuevo producto
export async function createProduct(productData) {
  try {
    const result = await query(
      `INSERT INTO products (
        name, slug, description, short_description, price, sale_price,
        sku, stock_quantity, manage_stock, stock_status, weight,
        dimensions, featured, status, meta_title, meta_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productData.name,
        productData.slug,
        productData.description,
        productData.short_description,
        productData.price,
        productData.sale_price,
        productData.sku,
        productData.stock_quantity,
        productData.manage_stock,
        productData.stock_status,
        productData.weight,
        productData.dimensions,
        productData.featured,
        productData.status,
        productData.meta_title,
        productData.meta_description
      ]
    );

    return result.insertId;
  } catch (error) {
    console.error('Error creando producto:', error);
    throw error;
  }
}

// Actualizar producto
export async function updateProduct(productId, productData) {
  try {
    await query(
      `UPDATE products SET 
       name = ?, slug = ?, description = ?, short_description = ?,
       price = ?, sale_price = ?, sku = ?, stock_quantity = ?,
       manage_stock = ?, stock_status = ?, weight = ?, dimensions = ?,
       featured = ?, status = ?, meta_title = ?, meta_description = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        productData.name,
        productData.slug,
        productData.description,
        productData.short_description,
        productData.price,
        productData.sale_price,
        productData.sku,
        productData.stock_quantity,
        productData.manage_stock,
        productData.stock_status,
        productData.weight,
        productData.dimensions,
        productData.featured,
        productData.status,
        productData.meta_title,
        productData.meta_description,
        productId
      ]
    );

    return true;
  } catch (error) {
    console.error('Error actualizando producto:', error);
    throw error;
  }
}

// Eliminar producto
export async function deleteProduct(productId) {
  try {
    // Eliminar relaciones primero
    await query('DELETE FROM product_categories WHERE product_id = ?', [productId]);
    await query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await query('DELETE FROM reviews WHERE product_id = ?', [productId]);
    
    // Eliminar producto
    await query('DELETE FROM products WHERE id = ?', [productId]);

    return true;
  } catch (error) {
    console.error('Error eliminando producto:', error);
    throw error;
  }
}