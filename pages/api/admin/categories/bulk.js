// pages/api/admin/categories/bulk.js
import { query, transaction } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { action, category_ids, options = {} } = req.body;

    if (!action || !category_ids || !Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Acción y IDs de categorías son requeridos'
      });
    }

    // Validar que las categorías existen
    const placeholders = category_ids.map(() => '?').join(',');
    const existingCategories = await query(
      `SELECT id, name FROM categories WHERE id IN (${placeholders})`,
      category_ids
    );

    if (existingCategories.length !== category_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Algunas categorías no existen'
      });
    }

    let result = {};

    switch (action) {
      case 'delete':
        result = await bulkDelete(category_ids, options);
        break;
      case 'activate':
        result = await bulkUpdateStatus(category_ids, 'active');
        break;
      case 'deactivate':
        result = await bulkUpdateStatus(category_ids, 'inactive');
        break;
      case 'feature':
        result = await bulkUpdateFeatured(category_ids, true);
        break;
      case 'unfeature':
        result = await bulkUpdateFeatured(category_ids, false);
        break;
      case 'move':
        if (!options.parent_id && options.parent_id !== null) {
          return res.status(400).json({
            success: false,
            message: 'parent_id es requerido para la acción move'
          });
        }
        result = await bulkMove(category_ids, options.parent_id);
        break;
      case 'reorder':
        if (!options.sort_orders || !Array.isArray(options.sort_orders)) {
          return res.status(400).json({
            success: false,
            message: 'sort_orders es requerido para la acción reorder'
          });
        }
        result = await bulkReorder(category_ids, options.sort_orders);
        break;
      case 'duplicate':
        result = await bulkDuplicate(category_ids, options);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Acción no válida'
        });
    }

    res.status(200).json({
      success: true,
      message: `Acción ${action} ejecutada exitosamente en ${category_ids.length} categoría(s)`,
      data: result
    });

  } catch (error) {
    console.error('Error en acción masiva de categorías:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
}

async function bulkDelete(categoryIds, options = {}) {
  const { force = false, move_products_to = null } = options;
  
  return await transaction(async (conn) => {
    const results = {
      deleted: [],
      skipped: [],
      errors: []
    };

    for (const categoryId of categoryIds) {
      try {
        // Verificar si tiene subcategorías
        const [childrenCheck] = await conn.query(
          'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
          [categoryId]
        );

        if (childrenCheck.count > 0 && !force) {
          results.skipped.push({
            id: categoryId,
            reason: 'Tiene subcategorías'
          });
          continue;
        }

        // Verificar productos asociados
        const [productsCheck] = await conn.query(
          'SELECT COUNT(*) as count FROM product_categories WHERE category_id = ?',
          [categoryId]
        );

        if (productsCheck.count > 0) {
          if (move_products_to) {
            // Mover productos a otra categoría
            await conn.query(
              'UPDATE product_categories SET category_id = ? WHERE category_id = ?',
              [move_products_to, categoryId]
            );
          } else if (!force) {
            results.skipped.push({
              id: categoryId,
              reason: `Tiene ${productsCheck.count} productos asociados`
            });
            continue;
          } else {
            // Eliminar relaciones de productos
            await conn.query(
              'DELETE FROM product_categories WHERE category_id = ?',
              [categoryId]
            );
          }
        }

        // Si force es true, eliminar subcategorías primero
        if (force && childrenCheck.count > 0) {
          await conn.query(
            'DELETE FROM categories WHERE parent_id = ?',
            [categoryId]
          );
        }

        // Eliminar la categoría
        await conn.query('DELETE FROM categories WHERE id = ?', [categoryId]);
        
        results.deleted.push(categoryId);

      } catch (error) {
        results.errors.push({
          id: categoryId,
          error: error.message
        });
      }
    }

    return results;
  });
}

async function bulkUpdateStatus(categoryIds, status) {
  const placeholders = categoryIds.map(() => '?').join(',');
  
  await query(
    `UPDATE categories SET status = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
    [status, ...categoryIds]
  );

  return {
    updated: categoryIds.length,
    new_status: status
  };
}

async function bulkUpdateFeatured(categoryIds, featured) {
  const placeholders = categoryIds.map(() => '?').join(',');
  
  await query(
    `UPDATE categories SET featured = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
    [featured ? 1 : 0, ...categoryIds]
  );

  return {
    updated: categoryIds.length,
    featured: featured
  };
}

async function bulkMove(categoryIds, newParentId) {
  return await transaction(async (conn) => {
    const results = {
      moved: [],
      skipped: []
    };

    // Verificar que el nuevo padre existe (si no es null)
    if (newParentId !== null) {
      const [parentCheck] = await conn.query(
        'SELECT id FROM categories WHERE id = ?',
        [newParentId]
      );
      
      if (!parentCheck) {
        throw new Error('La categoría padre de destino no existe');
      }
    }

    for (const categoryId of categoryIds) {
      // Verificar que no se cree un ciclo
      if (newParentId && await wouldCreateCycle(categoryId, newParentId, conn)) {
        results.skipped.push({
          id: categoryId,
          reason: 'Crearía un ciclo en la jerarquía'
        });
        continue;
      }

      await conn.query(
        'UPDATE categories SET parent_id = ?, updated_at = NOW() WHERE id = ?',
        [newParentId, categoryId]
      );

      results.moved.push(categoryId);
    }

    return results;
  });
}

async function bulkReorder(categoryIds, sortOrders) {
  if (categoryIds.length !== sortOrders.length) {
    throw new Error('El número de categorías debe coincidir con el número de órdenes');
  }

  return await transaction(async (conn) => {
    for (let i = 0; i < categoryIds.length; i++) {
      await conn.query(
        'UPDATE categories SET sort_order = ?, updated_at = NOW() WHERE id = ?',
        [sortOrders[i], categoryIds[i]]
      );
    }

    return {
      reordered: categoryIds.length,
      new_orders: sortOrders
    };
  });
}

async function bulkDuplicate(categoryIds, options = {}) {
  const { suffix = ' (Copia)', copy_products = false } = options;

  return await transaction(async (conn) => {
    const duplicated = [];

    for (const categoryId of categoryIds) {
      // Obtener categoría original
      const [originalCategory] = await conn.query(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      if (!originalCategory) continue;

      // Generar nuevo nombre y slug
      let newName = originalCategory.name + suffix;
      let newSlug = originalCategory.slug + '-copia';

      // Verificar que el slug no exista
      let slugCounter = 1;
      let finalSlug = newSlug;
      while (true) {
        const [existingSlug] = await conn.query(
          'SELECT id FROM categories WHERE slug = ?',
          [finalSlug]
        );
        
        if (!existingSlug) break;
        
        finalSlug = `${newSlug}-${slugCounter}`;
        slugCounter++;
      }

      // Crear nueva categoría
      const duplicateResult = await conn.query(`
        INSERT INTO categories (
          name, slug, description, parent_id, image_url, icon,
          meta_title, meta_description, featured, status, color,
          sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        newName, finalSlug, originalCategory.description, originalCategory.parent_id,
        originalCategory.image_url, originalCategory.icon, originalCategory.meta_title,
        originalCategory.meta_description, originalCategory.featured, 'inactive',
        originalCategory.color, originalCategory.sort_order
      ]);

      const newCategoryId = duplicateResult.insertId;

      // Copiar productos si se solicita
      if (copy_products) {
        const productCategories = await conn.query(
          'SELECT product_id FROM product_categories WHERE category_id = ?',
          [categoryId]
        );

        for (const pc of productCategories) {
          await conn.query(
            'INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
            [pc.product_id, newCategoryId]
          );
        }
      }

      duplicated.push({
        original_id: categoryId,
        new_id: newCategoryId,
        new_name: newName,
        new_slug: finalSlug
      });
    }

    return { duplicated };
  });
}

// Función auxiliar para detectar ciclos
async function wouldCreateCycle(categoryId, newParentId, conn) {
  let currentParentId = newParentId;
  const visitedIds = new Set();

  while (currentParentId) {
    if (currentParentId == categoryId) {
      return true;
    }

    if (visitedIds.has(currentParentId)) {
      return true;
    }

    visitedIds.add(currentParentId);

    const [parent] = await conn.query(
      'SELECT parent_id FROM categories WHERE id = ?',
      [currentParentId]
    );

    if (!parent) break;
    currentParentId = parent.parent_id;
  }

  return false;
}

export default adminAuth(handler);