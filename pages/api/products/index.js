// pages/api/products/index.js - VERSION CON CACHÉ
import { query } from '../../../lib/database';
import { withProductCache } from '../../../lib/cache/middleware';
import { CACHE_CONFIG, generateCacheKey } from '../../../lib/cache/config';
import cache from '../../../lib/cache/memory-cache';

// Handler principal con caché
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  // Si es una búsqueda, usar TTL más corto
  const isSearch = !!req.query.search;
  const cacheKey = generateCacheKey('products:list', req.query);
  const ttl = isSearch ? CACHE_CONFIG.TTL.SEARCH_RESULTS : CACHE_CONFIG.TTL.PRODUCT_LIST;

  // Intentar caché primero
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`🎯 Products Cache HIT`);
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('X-Cache-TTL', ttl);
    res.setHeader('Cache-Control', `public, max-age=${ttl}, stale-while-revalidate=60`);
    return res.status(200).json(cached);
  }

  try {
    const {
      page = 1,
      limit = 20,
      category,
      category_id,
      search,
      min_price,
      max_price,
      sort = 'created_at',
      order = 'DESC',
      exclude,
      status = 'active',
      prioritize_stock = 'false'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    // Condiciones base
    conditions.push('p.status = ?');
    params.push(status);

    // Filtro por categoría (slug)
    if (category) {
      conditions.push(`
        p.id IN (
          SELECT pc.product_id 
          FROM product_categories pc 
          INNER JOIN categories c ON pc.category_id = c.id 
          WHERE c.slug = ?
        )
      `);
      params.push(category);
    }

    // Filtro por categoría (ID)
    if (category_id) {
      conditions.push(`
        p.id IN (
          SELECT pc.product_id 
          FROM product_categories pc 
          WHERE pc.category_id = ?
        )
      `);
      params.push(category_id);
    }

    // Filtro por búsqueda
    if (search) {
      conditions.push(`(
        p.name LIKE ? OR 
        p.description LIKE ? OR 
        p.short_description LIKE ? OR 
        p.sku LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filtro por precio mínimo
    if (min_price) {
      conditions.push('COALESCE(p.sale_price, p.price) >= ?');
      params.push(parseFloat(min_price));
    }

    // Filtro por precio máximo
    if (max_price) {
      conditions.push('COALESCE(p.sale_price, p.price) <= ?');
      params.push(parseFloat(max_price));
    }

    // Excluir producto específico
    if (exclude) {
      conditions.push('p.slug != ?');
      params.push(exclude);
    }

    // Validar campos de ordenamiento
    const validSortFields = ['name', 'price', 'created_at', 'updated_at', 'featured'];
    const validOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    // Construir ORDER BY
    let orderBy = '';
    if (prioritize_stock === 'true') {
      if (sortField === 'price') {
        orderBy = `
          CASE WHEN p.stock_status = 'in_stock' THEN 0 ELSE 1 END,
          COALESCE(p.sale_price, p.price) ${sortOrder}
        `;
      } else {
        orderBy = `
          CASE WHEN p.stock_status = 'in_stock' THEN 0 ELSE 1 END,
          p.${sortField} ${sortOrder}
        `;
      }
    } else {
      if (sortField === 'price') {
        orderBy = `COALESCE(p.sale_price, p.price) ${sortOrder}`;
      } else {
        orderBy = `p.${sortField} ${sortOrder}`;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // ====== OPTIMIZACIÓN: Usar COUNT(*) en lugar de COUNT(DISTINCT) ======
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    // ====== OPTIMIZACIÓN: Query con índices optimizados ======
    const productsQuery = `
      SELECT 
        p.*,
        pi.image_url as featured_image,
        pi.alt_text as image_alt
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = 1
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const productsResult = await query(productsQuery, [...params, parseInt(limit), offset]);

    // ====== OPTIMIZACIÓN: Batch query para categorías ======
    const productIds = productsResult.map(p => p.id);
    let categoriesData = [];

    if (productIds.length > 0) {
      const categoriesQuery = `
        SELECT 
          pc.product_id,
          c.id,
          c.name,
          c.slug
        FROM product_categories pc
        INNER JOIN categories c ON pc.category_id = c.id
        WHERE pc.product_id IN (${productIds.map(() => '?').join(',')})
        ORDER BY pc.product_id, c.name
      `;
      
      categoriesData = await query(categoriesQuery, productIds);
    }

    // Agrupar categorías por producto
    const categoriesByProduct = {};
    categoriesData.forEach(cat => {
      if (!categoriesByProduct[cat.product_id]) {
        categoriesByProduct[cat.product_id] = [];
      }
      categoriesByProduct[cat.product_id].push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      });
    });

    // Formatear productos
    const products = productsResult.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description,
      price: parseFloat(product.price),
      sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
      sku: product.sku,
      stock_status: product.stock_status,
      weight: product.weight,
      dimensions: product.dimensions,
      featured: product.featured,
      status: product.status,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      woocommerce_id: product.woocommerce_id,
      created_at: product.created_at,
      updated_at: product.updated_at,
      featured_image: product.featured_image,
      image_alt: product.image_alt,
      categories: categoriesByProduct[product.id] || []
    }));

    // Calcular paginación
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    const response = {
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Guardar en caché
    await cache.set(cacheKey, response, ttl);
    console.log(`💾 Products cached with TTL: ${ttl}s`);

    // Headers de respuesta
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-TTL', ttl);
    res.setHeader('Cache-Control', `public, max-age=${ttl}, stale-while-revalidate=60`);
    res.setHeader('X-Total-Count', total);

    res.status(200).json(response);

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    
    // No cachear errores
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Exportar con caché wrapper (opcional, ya lo manejamos arriba)
export default handler;