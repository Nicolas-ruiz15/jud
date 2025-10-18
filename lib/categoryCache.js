// lib/categoryCache.js
import { query } from './database';

class CategoryCache {
  constructor() {
    this.cache = new Map();
    this.hierarchyCache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutos
    this.lastClearTime = Date.now();
  }

  // Limpiar cache expirado
  clearExpired() {
    const now = Date.now();
    
    // Limpiar cada 10 minutos
    if (now - this.lastClearTime > 10 * 60 * 1000) {
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.ttl) {
          this.cache.delete(key);
        }
      }
      
      for (const [key, value] of this.hierarchyCache.entries()) {
        if (now - value.timestamp > this.ttl) {
          this.hierarchyCache.delete(key);
        }
      }
      
      this.lastClearTime = now;
    }
  }

  // Obtener desde cache o ejecutar query
  async get(key, queryFn) {
    this.clearExpired();
    
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await queryFn();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Invalidar cache específico
  invalidate(pattern) {
    if (typeof pattern === 'string') {
      this.cache.delete(pattern);
      this.hierarchyCache.delete(pattern);
    } else if (pattern instanceof RegExp) {
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
      for (const key of this.hierarchyCache.keys()) {
        if (pattern.test(key)) {
          this.hierarchyCache.delete(key);
        }
      }
    }
  }

  // Limpiar todo el cache
  clear() {
    this.cache.clear();
    this.hierarchyCache.clear();
  }

  // Obtener categorías con cache
  async getCategories(filters = {}) {
    const cacheKey = `categories_${JSON.stringify(filters)}`;
    
    return await this.get(cacheKey, async () => {
      const conditions = [];
      const params = [];

      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }

      if (filters.parent_id !== undefined) {
        if (filters.parent_id === null) {
          conditions.push('parent_id IS NULL');
        } else {
          conditions.push('parent_id = ?');
          params.push(filters.parent_id);
        }
      }

      if (filters.featured !== undefined) {
        conditions.push('featured = ?');
        params.push(filters.featured ? 1 : 0);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderClause = filters.orderBy || 'ORDER BY sort_order ASC, name ASC';
      const limitClause = filters.limit ? `LIMIT ${parseInt(filters.limit)}` : '';

      const categoriesQuery = `
        SELECT 
          c.*,
          COUNT(DISTINCT pc.product_id) as product_count,
          COUNT(DISTINCT children.id) as children_count
        FROM categories c
        LEFT JOIN product_categories pc ON c.id = pc.category_id
        LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
        LEFT JOIN categories children ON c.id = children.parent_id
        ${whereClause}
        GROUP BY c.id
        ${orderClause}
        ${limitClause}
      `;

      return await query(categoriesQuery, params);
    });
  }

  // Obtener categoría por ID con cache
  async getCategoryById(id) {
    const cacheKey = `category_${id}`;
    
    return await this.get(cacheKey, async () => {
      const categoryQuery = `
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
        WHERE c.id = ?
        GROUP BY c.id
      `;

      const result = await query(categoryQuery, [id]);
      return result[0] || null;
    });
  }

  // Obtener categoría por slug con cache
  async getCategoryBySlug(slug) {
    const cacheKey = `category_slug_${slug}`;
    
    return await this.get(cacheKey, async () => {
      const categoryQuery = `
        SELECT 
          c.*,
          COUNT(DISTINCT pc.product_id) as product_count,
          COUNT(DISTINCT children.id) as children_count
        FROM categories c
        LEFT JOIN product_categories pc ON c.id = pc.category_id
        LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
        LEFT JOIN categories children ON c.id = children.parent_id
        WHERE c.slug = ?
        GROUP BY c.id
      `;

      const result = await query(categoryQuery, [slug]);
      return result[0] || null;
    });
  }

  // Obtener jerarquía completa con cache
  async getHierarchy(maxDepth = 3) {
    const cacheKey = `hierarchy_${maxDepth}`;
    
    const cached = this.hierarchyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const hierarchy = await this.buildHierarchy(maxDepth);
    this.hierarchyCache.set(cacheKey, {
      data: hierarchy,
      timestamp: Date.now()
    });

    return hierarchy;
  }

  // Construir jerarquía recursiva
  async buildHierarchy(maxDepth = 3, parentId = null, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const categories = await query(`
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count,
        COUNT(DISTINCT children.id) as children_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      LEFT JOIN categories children ON c.id = children.parent_id
      WHERE c.parent_id ${parentId === null ? 'IS NULL' : '= ?'} AND c.status = 'active'
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `, parentId === null ? [] : [parentId]);

    const result = [];
    for (const category of categories) {
      const children = await this.buildHierarchy(maxDepth, category.id, currentDepth + 1);
      
      result.push({
        ...category,
        featured: Boolean(category.featured),
        product_count: parseInt(category.product_count) || 0,
        children_count: parseInt(category.children_count) || 0,
        level: currentDepth,
        children
      });
    }

    return result;
  }

  // Obtener ruta jerárquica con cache
  async getHierarchyPath(categoryId) {
    const cacheKey = `hierarchy_path_${categoryId}`;
    
    return await this.get(cacheKey, async () => {
      const path = [];
      let currentId = categoryId;

      while (currentId) {
        const category = await query(
          'SELECT id, name, slug, parent_id FROM categories WHERE id = ?',
          [currentId]
        );

        if (category.length === 0) break;

        path.unshift({
          id: category[0].id,
          name: category[0].name,
          slug: category[0].slug
        });

        currentId = category[0].parent_id;
      }

      return path;
    });
  }

  // Obtener estadísticas con cache
  async getStats() {
    const cacheKey = 'category_stats';
    
    return await this.get(cacheKey, async () => {
      const [
        totalStats,
        statusStats,
        hierarchyStats,
        featuredStats,
        imageStats
      ] = await Promise.all([
        query('SELECT COUNT(*) as total FROM categories'),
        query(`SELECT status, COUNT(*) as count FROM categories GROUP BY status`),
        query(`
          SELECT 
            CASE WHEN parent_id IS NULL THEN 'parent' ELSE 'child' END as type,
            COUNT(*) as count
          FROM categories 
          GROUP BY type
        `),
        query(`SELECT featured, COUNT(*) as count FROM categories GROUP BY featured`),
        query(`
          SELECT 
            CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 'with_images' ELSE 'without_images' END as status,
            COUNT(*) as count
          FROM categories
          GROUP BY status
        `)
      ]);

      const total = totalStats[0]?.total || 0;
      
      return {
        total,
        active: statusStats.find(s => s.status === 'active')?.count || 0,
        inactive: statusStats.find(s => s.status === 'inactive')?.count || 0,
        parent: hierarchyStats.find(s => s.type === 'parent')?.count || 0,
        children: hierarchyStats.find(s => s.type === 'child')?.count || 0,
        featured: featuredStats.find(s => s.featured === 1)?.count || 0,
        withImages: imageStats.find(s => s.status === 'with_images')?.count || 0,
        noImages: imageStats.find(s => s.status === 'without_images')?.count || 0,
        percentages: {
          active: total > 0 ? ((statusStats.find(s => s.status === 'active')?.count || 0) / total * 100).toFixed(1) : 0,
          withImages: total > 0 ? ((imageStats.find(s => s.status === 'with_images')?.count || 0) / total * 100).toFixed(1) : 0,
          featured: total > 0 ? ((featuredStats.find(s => s.featured === 1)?.count || 0) / total * 100).toFixed(1) : 0
        }
      };
    });
  }

  // Invalidar cache cuando se modifican categorías
  invalidateCategoryCache(categoryId = null, parentId = null) {
    if (categoryId) {
      this.invalidate(`category_${categoryId}`);
      this.invalidate(new RegExp(`hierarchy_path_${categoryId}`));
    }

    if (parentId) {
      this.invalidate(new RegExp(`categories_.*parent_id.*${parentId}`));
    }

    // Invalidar jerarquía y estadísticas
    this.invalidate(/^hierarchy_/);
    this.invalidate('category_stats');
    
    // Invalidar listados generales
    this.invalidate(/^categories_/);
  }

  // Precargar categorías populares
  async warmUp() {
    try {
      console.log('🔄 Precargando cache de categorías...');
      
      // Precargar categorías principales
      await this.getCategories({ parent_id: null, status: 'active' });
      
      // Precargar jerarquía
      await this.getHierarchy();
      
      // Precargar estadísticas
      await this.getStats();
      
      console.log('✅ Cache de categorías precargado');
    } catch (error) {
      console.error('❌ Error precargando cache de categorías:', error);
    }
  }

  // Obtener información del cache
  getCacheInfo() {
    return {
      categories: this.cache.size,
      hierarchy: this.hierarchyCache.size,
      ttl: this.ttl,
      lastClear: new Date(this.lastClearTime).toISOString()
    };
  }
}

// Singleton para cache global
const categoryCache = new CategoryCache();

// Funciones helper para uso en APIs
export const getCachedCategories = (filters) => categoryCache.getCategories(filters);
export const getCachedCategoryById = (id) => categoryCache.getCategoryById(id);
export const getCachedCategoryBySlug = (slug) => categoryCache.getCategoryBySlug(slug);
export const getCachedHierarchy = (maxDepth) => categoryCache.getHierarchy(maxDepth);
export const getCachedHierarchyPath = (categoryId) => categoryCache.getHierarchyPath(categoryId);
export const getCachedStats = () => categoryCache.getStats();
export const invalidateCategoryCache = (categoryId, parentId) => categoryCache.invalidateCategoryCache(categoryId, parentId);
export const warmUpCategoryCache = () => categoryCache.warmUp();
export const getCacheInfo = () => categoryCache.getCacheInfo();
export const clearCategoryCache = () => categoryCache.clear();

export default categoryCache;