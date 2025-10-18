// pages/api/admin/categories/[id].js
import { query, transaction } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case 'GET':
        return await getCategory(req, res, id);
      case 'PUT':
        return await updateCategory(req, res, id);
      case 'DELETE':
        return await deleteCategory(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: `Método ${method} no permitido`
        });
    }
  } catch (error) {
    console.error('Error en API categories/[id]:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET /api/admin/categories/[id] - Obtener categoría específica
async function getCategory(req, res, categoryId) {
  try {
    // Consulta principal de la categoría
    const categoryQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count,
        COUNT(DISTINCT children.id) as children_count,
        parent.name as parent_name,
        parent.slug as parent_slug,
        parent.id as parent_id_ref
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      LEFT JOIN categories children ON c.id = children.parent_id
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.id = ?
      GROUP BY c.id
    `;
    
    const categoryResult = await query(categoryQuery, [categoryId]);
    
    if (categoryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const category = categoryResult[0];

    // Obtener categorías hijas
    const childrenQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      WHERE c.parent_id = ?
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    const children = await query(childrenQuery, [categoryId]);

    // Obtener productos de la categoría (muestra limitada)
    const productsQuery = `
      SELECT 
        p.id, p.name, p.slug, p.price, p.status,
        pi.image_url as featured_image
      FROM products p
      INNER JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = 1
      WHERE pc.category_id = ? AND p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 10
    `;
    const products = await query(productsQuery, [categoryId]);

    // Formatear datos de respuesta
    const formattedCategory = {
      ...category,
      featured: Boolean(category.featured),
      product_count: parseInt(category.product_count) || 0,
      children_count: parseInt(category.children_count) || 0,
      has_children: parseInt(category.children_count) > 0,
      children: children.map(child => ({
        ...child,
        featured: Boolean(child.featured),
        product_count: parseInt(child.product_count) || 0
      })),
      recent_products: products,
      hierarchy_path: await getHierarchyPath(categoryId)
    };

    return res.status(200).json({
      success: true,
      data: formattedCategory,
      message: 'Categoría obtenida exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    throw error;
  }
}

// PUT /api/admin/categories/[id] - Actualizar categoría
async function updateCategory(req, res, categoryId) {
  const {
    name,
    slug,
    description,
    parent_id,
    image_url,
    icon,
    meta_title,
    meta_description,
    featured,
    status,
    color,
    sort_order,
    auto_save = false
  } = req.body;

  try {
    // Validaciones básicas (omitir en auto-save)
    if (!auto_save) {
      if (!name?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es requerido'
        });
      }

      if (!slug?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El slug de la categoría es requerido'
        });
      }
    }

    // Verificar que la categoría existe
    const existingCategory = await query('SELECT id, parent_id FROM categories WHERE id = ?', [categoryId]);
    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar slug único (excluyendo la categoría actual)
    if (slug && !auto_save) {
      const slugCheck = await query(
        'SELECT id FROM categories WHERE slug = ? AND id != ?',
        [slug, categoryId]
      );
      if (slugCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El slug ya está en uso por otra categoría'
        });
      }
    }

    // Verificar categoría padre (prevenir ciclos)
    if (parent_id && parent_id != categoryId) {
      const parentCheck = await query('SELECT id FROM categories WHERE id = ?', [parent_id]);
      if (parentCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La categoría padre no existe'
        });
      }

      // Verificar que no se cree un ciclo
      if (await wouldCreateCycle(categoryId, parent_id)) {
        return res.status(400).json({
          success: false,
          message: 'La categoría padre seleccionada crearía un ciclo'
        });
      }
    }

    // Actualizar categoría
    const updateQuery = `
      UPDATE categories SET
        name = ?,
        slug = ?,
        description = ?,
        parent_id = ?,
        image_url = ?,
        icon = ?,
        meta_title = ?,
        meta_description = ?,
        featured = ?,
        status = ?,
        color = ?,
        sort_order = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateQuery, [
      name || null,
      slug || null,
      description || null,
      parent_id || null,
      image_url || null,
      icon || null,
      meta_title || null,
      meta_description || null,
      featured ? 1 : 0,
      status || 'active',
      color || null,
      sort_order ? parseInt(sort_order) : 0,
      categoryId
    ]);

    // Obtener categoría actualizada con relaciones
    const updatedCategoryQuery = `
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
    `;
    
    const updatedCategory = await query(updatedCategoryQuery, [categoryId]);

    return res.status(200).json({
      success: true,
      data: {
        ...updatedCategory[0],
        featured: Boolean(updatedCategory[0].featured),
        product_count: parseInt(updatedCategory[0].product_count) || 0,
        updated: true
      },
      message: auto_save ? 'Categoría guardada automáticamente' : 'Categoría actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    throw error;
  }
}

// DELETE /api/admin/categories/[id] - Eliminar categoría
async function deleteCategory(req, res, categoryId) {
  try {
    // Verificar que la categoría existe
    const existingCategory = await query('SELECT id, name FROM categories WHERE id = ?', [categoryId]);
    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si tiene categorías hijas
    const childrenCheck = await query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [categoryId]
    );
    
    if (childrenCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una categoría que tiene subcategorías. Elimine primero las subcategorías.'
      });
    }

    // Verificar si tiene productos asociados
    const productsCheck = await query(
      'SELECT COUNT(*) as count FROM product_categories WHERE category_id = ?',
      [categoryId]
    );
    
    if (productsCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `La categoría tiene ${productsCheck[0].count} producto(s) asociado(s). Mueve los productos a otra categoría antes de eliminar.`
      });
    }

    // Eliminar la categoría
    await query('DELETE FROM categories WHERE id = ?', [categoryId]);

    return res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente',
      data: { id: categoryId, deleted: true }
    });

  } catch (error) {
    console.error('Error eliminando categoría:', error);
    throw error;
  }
}

// Función auxiliar para obtener la ruta jerárquica
async function getHierarchyPath(categoryId) {
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
}

// Función auxiliar para detectar ciclos en jerarquía
async function wouldCreateCycle(categoryId, newParentId) {
  let currentParentId = newParentId;
  const visitedIds = new Set();

  while (currentParentId) {
    if (currentParentId == categoryId) {
      return true; // Ciclo detectado
    }

    if (visitedIds.has(currentParentId)) {
      return true; // Ciclo en la jerarquía existente
    }

    visitedIds.add(currentParentId);

    const parent = await query(
      'SELECT parent_id FROM categories WHERE id = ?',
      [currentParentId]
    );

    if (parent.length === 0) break;
    currentParentId = parent[0].parent_id;
  }

  return false;
}

export default adminAuth(handler);