// pages/api/admin/categories/import-export.js
import { query, transaction } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      return await importCategories(req, res);
    case 'GET':
      return await exportCategories(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
}

async function exportCategories(req, res) {
  try {
    const {
      format = 'csv',
      include_hierarchy = 'true',
      include_products = 'false',
      status,
      parent_id
    } = req.query;

    // Construir filtros
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }

    if (parent_id !== undefined) {
      if (parent_id === 'null' || parent_id === '') {
        conditions.push('c.parent_id IS NULL');
      } else {
        conditions.push('c.parent_id = ?');
        params.push(parseInt(parent_id));
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query principal
    let exportQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count,
        parent.name as parent_name,
        parent.slug as parent_slug
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      LEFT JOIN categories parent ON c.parent_id = parent.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    const categories = await query(exportQuery, params);

    // Enriquecer datos si se solicita
    const enrichedCategories = await Promise.all(
      categories.map(async (category) => {
        const enriched = { ...category };

        // Incluir jerarquía completa
        if (include_hierarchy === 'true') {
          enriched.hierarchy_path = await getHierarchyPath(category.id);
          enriched.children_count = await getChildrenCount(category.id);
        }

        // Incluir productos
        if (include_products === 'true' && category.product_count > 0) {
          const products = await query(`
            SELECT p.id, p.name, p.slug, p.price, p.status
            FROM products p
            INNER JOIN product_categories pc ON p.id = pc.product_id
            WHERE pc.category_id = ?
            ORDER BY p.name ASC
          `, [category.id]);

          enriched.products = products.map(p => p.name).join('; ');
          enriched.product_ids = products.map(p => p.id).join('; ');
        }

        return enriched;
      })
    );

    // Formatear para exportación
    const exportData = enrichedCategories.map(category => ({
      'ID': category.id,
      'Nombre': category.name,
      'Slug': category.slug,
      'Descripción': category.description || '',
      'Categoría Padre': category.parent_name || '',
      'Slug Padre': category.parent_slug || '',
      'Imagen URL': category.image_url || '',
      'Icono': category.icon || '',
      'Color': category.color || '',
      'Meta Título': category.meta_title || '',
      'Meta Descripción': category.meta_description || '',
      'Destacada': category.featured ? 'Sí' : 'No',
      'Estado': category.status,
      'Orden': category.sort_order || 0,
      'Total Productos': category.product_count || 0,
      'Ruta Jerárquica': category.hierarchy_path || '',
      'Hijos': category.children_count || 0,
      'Productos': category.products || '',
      'Fecha Creación': category.created_at,
      'Última Actualización': category.updated_at
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="categorias-${new Date().toISOString().split('T')[0]}.json"`);
      return res.status(200).json({
        success: true,
        data: exportData,
        total: exportData.length,
        exported_at: new Date().toISOString()
      });
    } else {
      // CSV export
      const csvData = stringify(exportData, {
        header: true,
        delimiter: ',',
        quoted: true
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="categorias-${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send('\ufeff' + csvData); // BOM for UTF-8
    }

  } catch (error) {
    console.error('Error exportando categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function importCategories(req, res) {
  try {
    const { csvData, options = {} } = req.body;

    if (!csvData) {
      return res.status(400).json({
        success: false,
        message: 'Datos CSV requeridos'
      });
    }

    // Parsear CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se encontraron datos válidos en el CSV'
      });
    }

    const results = {
      total: records.length,
      imported: 0,
      updated: 0,
      errors: []
    };

    await transaction(async (conn) => {
      // Crear un mapa de categorías padre por nombre/slug para resolver referencias
      const parentMap = new Map();

      // Primera pasada: crear/actualizar categorías padre (sin parent_id)
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        if (record['Categoría Padre']) {
          continue; // Procesar en segunda pasada
        }

        try {
          const result = await processCategory(record, null, conn, options);
          if (result.success) {
            parentMap.set(record.Nombre, result.categoryId);
            parentMap.set(record.Slug, result.categoryId);
            
            if (result.created) {
              results.imported++;
            } else {
              results.updated++;
            }
          }
        } catch (error) {
          results.errors.push({
            row: i + 1,
            error: error.message
          });
        }
      }

      // Segunda pasada: crear/actualizar categorías hijas
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        if (!record['Categoría Padre']) {
          continue; // Ya procesado
        }

        try {
          // Resolver parent_id
          const parentId = parentMap.get(record['Categoría Padre']) || 
                          parentMap.get(record['Slug Padre']);

          if (!parentId) {
            throw new Error(`Categoría padre "${record['Categoría Padre']}" no encontrada`);
          }

          const result = await processCategory(record, parentId, conn, options);
          if (result.success) {
            if (result.created) {
              results.imported++;
            } else {
              results.updated++;
            }
          }
        } catch (error) {
          results.errors.push({
            row: i + 1,
            error: error.message
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Importación completada',
      data: results
    });

  } catch (error) {
    console.error('Error importando categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function processCategory(record, parentId, conn, options) {
  // Validar campos requeridos
  if (!record.Nombre) {
    throw new Error('El nombre es requerido');
  }

  // Generar slug si no existe
  let slug = record.Slug || generateSlug(record.Nombre);
  
  // Preparar datos de la categoría
  const categoryData = {
    name: record.Nombre,
    slug: slug,
    description: record.Descripción || '',
    parent_id: parentId,
    image_url: record['Imagen URL'] || null,
    icon: record.Icono || null,
    color: record.Color || null,
    meta_title: record['Meta Título'] || '',
    meta_description: record['Meta Descripción'] || '',
    featured: record.Destacada === 'Sí' ? 1 : 0,
    status: record.Estado || 'active',
    sort_order: parseInt(record.Orden) || 0
  };

  // Verificar si existe por ID o slug
  let existingCategory = null;
  if (record.ID) {
    [existingCategory] = await conn.query(
      'SELECT id FROM categories WHERE id = ?',
      [record.ID]
    );
  } else {
    [existingCategory] = await conn.query(
      'SELECT id FROM categories WHERE slug = ?',
      [slug]
    );
  }

  let categoryId;
  let created = false;

  if (existingCategory && options.update_existing) {
    // Actualizar categoría existente
    await conn.query(`
      UPDATE categories SET 
        name = ?, slug = ?, description = ?, parent_id = ?, 
        image_url = ?, icon = ?, color = ?, meta_title = ?, 
        meta_description = ?, featured = ?, status = ?, 
        sort_order = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      categoryData.name, categoryData.slug, categoryData.description,
      categoryData.parent_id, categoryData.image_url, categoryData.icon,
      categoryData.color, categoryData.meta_title, categoryData.meta_description,
      categoryData.featured, categoryData.status, categoryData.sort_order,
      existingCategory.id
    ]);

    categoryId = existingCategory.id;
  } else if (!existingCategory) {
    // Verificar slug único
    let finalSlug = slug;
    let slugCounter = 1;
    while (true) {
      const [existing] = await conn.query(
        'SELECT id FROM categories WHERE slug = ?',
        [finalSlug]
      );
      
      if (!existing) break;
      
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }

    // Crear nueva categoría
    const result = await conn.query(`
      INSERT INTO categories (
        name, slug, description, parent_id, image_url, icon, color,
        meta_title, meta_description, featured, status, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      categoryData.name, finalSlug, categoryData.description,
      categoryData.parent_id, categoryData.image_url, categoryData.icon,
      categoryData.color, categoryData.meta_title, categoryData.meta_description,
      categoryData.featured, categoryData.status, categoryData.sort_order
    ]);

    categoryId = result.insertId;
    created = true;
  } else {
    throw new Error('La categoría ya existe y actualización no habilitada');
  }

  return { success: true, categoryId, created };
}

async function getHierarchyPath(categoryId) {
  const path = [];
  let currentId = categoryId;

  while (currentId) {
    const [category] = await query(
      'SELECT id, name, slug, parent_id FROM categories WHERE id = ?',
      [currentId]
    );

    if (!category) break;

    path.unshift(category.name);
    currentId = category.parent_id;
  }

  return path.join(' > ');
}

async function getChildrenCount(categoryId) {
  const [result] = await query(
    'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
    [categoryId]
  );
  
  return result.count || 0;
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[çc]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default adminAuth(handler);