// pages/api/admin/products/[id].js
const { query, queryOne, transaction } = require('../../../../lib/database');
const { adminAuth } = require('../../../../middleware/adminAuth');

// Función principal del handler envuelta con adminAuth
async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case 'GET':
        return await getProduct(req, res, id);
      case 'PUT':
        return await updateProduct(req, res, id);
      case 'DELETE':
        return await deleteProduct(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: `Método ${method} no permitido`
        });
    }
  } catch (error) {
    console.error('Error en API products/[id]:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Exportar con el middleware de autenticación
export default adminAuth(handler);

// GET /api/admin/products/[id] - Obtener producto específico
async function getProduct(req, res, productId) {
  try {
    // Consulta principal del producto
    const productQuery = `
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT pc.category_id) as category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    
    const productResult = await query(productQuery, [productId]);
    
    if (productResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const product = productResult[0];

    // Obtener categorías del producto
    const categoriesQuery = `
      SELECT c.id, c.name, c.slug
      FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ?
    `;
    const categories = await query(categoriesQuery, [productId]);

    // Obtener imágenes del producto
    const imagesQuery = `
      SELECT id, image_url, alt_text, is_featured, sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC, id ASC
    `;
    const images = await query(imagesQuery, [productId]);

    // Formatear datos de respuesta
    const formattedProduct = {
      ...product,
      price: parseFloat(product.price) || 0,
      sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
      weight: product.weight ? parseFloat(product.weight) : null,
      stock_quantity: parseInt(product.stock_quantity) || 0,
      manage_stock: Boolean(product.manage_stock),
      featured: Boolean(product.featured),
      categories: categories,
      images: images.map(img => ({
        ...img,
        is_featured: Boolean(img.is_featured)
      })),
      category_ids: product.category_ids ? product.category_ids.split(',').map(id => parseInt(id)) : []
    };

    return res.status(200).json({
      success: true,
      data: formattedProduct,
      message: 'Producto obtenido exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo producto:', error);
    throw error;
  }
}

// PUT /api/admin/products/[id] - Actualizar producto
async function updateProduct(req, res, productId) {
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
    meta_description,
    category_ids = [],
    images = [],
    auto_save = false
  } = req.body;

  try {
    // Validaciones básicas
    if (!auto_save) {
      if (!name?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del producto es requerido'
        });
      }

      if (!slug?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El slug del producto es requerido'
        });
      }

      if (!price || parseFloat(price) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio debe ser mayor a 0'
        });
      }
    }

    // Verificar que el producto existe
    const existingProduct = await query('SELECT id FROM products WHERE id = ?', [productId]);
    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar slug único (excluyendo el producto actual)
    if (slug && !auto_save) {
      const slugCheck = await query(
        'SELECT id FROM products WHERE slug = ? AND id != ?',
        [slug, productId]
      );
      if (slugCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El slug ya está en uso por otro producto'
        });
      }
    }

    // Verificar SKU único (si se proporciona)
    if (sku && !auto_save) {
      const skuCheck = await query(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [sku, productId]
      );
      if (skuCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El SKU ya está en uso por otro producto'
        });
      }
    }

    // Actualizar producto principal
    const updateQuery = `
      UPDATE products SET
        name = ?,
        slug = ?,
        description = ?,
        short_description = ?,
        price = ?,
        sale_price = ?,
        sku = ?,
        stock_quantity = ?,
        manage_stock = ?,
        stock_status = ?,
        weight = ?,
        dimensions = ?,
        featured = ?,
        status = ?,
        meta_title = ?,
        meta_description = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateQuery, [
      name || null,
      slug || null,
      description || null,
      short_description || null,
      price ? parseFloat(price) : null,
      sale_price ? parseFloat(sale_price) : null,
      sku || null,
      stock_quantity ? parseInt(stock_quantity) : 0,
      manage_stock ? 1 : 0,
      stock_status || 'in_stock',
      weight ? parseFloat(weight) : null,
      dimensions || null,
      featured ? 1 : 0,
      status || 'active',
      meta_title || null,
      meta_description || null,
      productId
    ]);

    // Actualizar categorías si no es auto-save
    if (!auto_save && Array.isArray(category_ids)) {
      // Eliminar categorías existentes
      await query('DELETE FROM product_categories WHERE product_id = ?', [productId]);
      
      // Insertar nuevas categorías
      if (category_ids.length > 0) {
        const categoryValues = category_ids.map(catId => [productId, parseInt(catId)]);
        const categoryPlaceholders = categoryValues.map(() => '(?, ?)').join(', ');
        const categoryInsertQuery = `INSERT INTO product_categories (product_id, category_id) VALUES ${categoryPlaceholders}`;
        const flatCategoryValues = categoryValues.flat();
        await query(categoryInsertQuery, flatCategoryValues);
      }
    }

    // Actualizar imágenes si no es auto-save
    if (!auto_save && Array.isArray(images)) {
      // Obtener imágenes existentes para determinar cuáles eliminar
      const existingImages = await query(
        'SELECT id, image_url FROM product_images WHERE product_id = ?',
        [productId]
      );

      // Eliminar imágenes existentes que no están en la nueva lista
      const newImageUrls = images.map(img => img.image_url);
      const imagesToDelete = existingImages.filter(img => !newImageUrls.includes(img.image_url));
      
      for (const imgToDelete of imagesToDelete) {
        // Eliminar de la base de datos
        await query('DELETE FROM product_images WHERE id = ?', [imgToDelete.id]);
        // Eliminar de Cloudinary (opcional)
        // Si tienes configurado Cloudinary, descomenta:
        // try {
        //   await deleteFromCloudinary(imgToDelete.image_url);
        // } catch (cloudinaryError) {
        //   console.warn('Error eliminando imagen de Cloudinary:', cloudinaryError);
        // }
      }

      // Eliminar todas las imágenes existentes de la DB
      await query('DELETE FROM product_images WHERE product_id = ?', [productId]);

      // Insertar nuevas imágenes
      if (images.length > 0) {
        const imageValues = images.map((img, index) => [
          productId,
          img.image_url,
          img.alt_text || null,
          img.is_featured ? 1 : 0,
          img.sort_order || index
        ]);
        
        const imagePlaceholders = imageValues.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const imageInsertQuery = `
          INSERT INTO product_images (product_id, image_url, alt_text, is_featured, sort_order) 
          VALUES ${imagePlaceholders}
        `;
        const flatImageValues = imageValues.flat();
        await query(imageInsertQuery, flatImageValues);
      }
    }

    // Obtener producto actualizado con relaciones
    const updatedProductQuery = `
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT c.name) as category_names
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    
    const updatedProduct = await query(updatedProductQuery, [productId]);

    return res.status(200).json({
      success: true,
      data: {
        id: productId,
        ...updatedProduct[0],
        updated: true
      },
      message: auto_save ? 'Producto guardado automáticamente' : 'Producto actualizado exitosamente'
    });
	  // ✅ AGREGAR ESTAS LÍNEAS:
try {
  await res.revalidate('/'); // Revalidar homepage
  await res.revalidate('/productos'); // Revalidar página productos
  await res.revalidate(`/productos/${slug || updatedProduct[0].slug}`); // Producto específico
} catch (revalidateError) {
  console.warn('Error revalidating pages:', revalidateError);
  // No fallar la respuesta por error de revalidación
}

  } catch (error) {
    console.error('Error actualizando producto:', error);
    throw error;
  }
}

// DELETE /api/admin/products/[id] - Eliminar producto
async function deleteProduct(req, res, productId) {
  try {
    // Verificar que el producto existe
    const existingProduct = await query('SELECT id FROM products WHERE id = ?', [productId]);
    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si el producto tiene órdenes asociadas
    const orderItemsCheck = await query(
      'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
      [productId]
    );
    
    if (orderItemsCheck[0].count > 0) {
      // Si tiene órdenes, cambiar estado a inactivo en lugar de eliminar
      await query(
        'UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?',
        ['inactive', productId]
      );
      
      return res.status(200).json({
        success: true,
        message: 'Producto desactivado (tenía órdenes asociadas)',
        data: { id: productId, status: 'inactive' }
      });
    }

    // Obtener imágenes antes de eliminar para borrarlas de Cloudinary
    const images = await query('SELECT image_url FROM product_images WHERE product_id = ?', [productId]);

    // Eliminar relaciones primero
    await query('DELETE FROM product_categories WHERE product_id = ?', [productId]);
    await query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await query('DELETE FROM cart_items WHERE product_id = ?', [productId]);

    // Eliminar el producto
    await query('DELETE FROM products WHERE id = ?', [productId]);

    // Eliminar imágenes de Cloudinary (en background, no bloquear respuesta)
    // Si tienes configurado Cloudinary, descomenta:
    // if (images.length > 0) {
    //   Promise.all(
    //     images.map(async (img) => {
    //       try {
    //         await deleteFromCloudinary(img.image_url);
    //       } catch (error) {
    //         console.warn('Error eliminando imagen de Cloudinary:', error);
    //       }
    //     })
    //   );
    // }

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente',
      data: { id: productId, deleted: true }
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    throw error;
  }
}