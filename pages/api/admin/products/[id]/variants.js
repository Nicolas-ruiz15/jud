// pages/api/admin/products/[id]/variants.js
import { query, transaction } from '../../../../../lib/database';

export default async function handler(req, res) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return await getVariants(req, res, id);
    case 'POST':
      return await createVariant(req, res, id);
    case 'PUT':
      return await updateVariants(req, res, id);
    case 'DELETE':
      return await deleteVariants(req, res, id);
    default:
      return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
}

async function getVariants(req, res, productId) {
  try {
    // Verificar que el producto existe
    const [product] = await query(
      'SELECT id, name FROM products WHERE id = ? AND status != "deleted"',
      [productId]
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Obtener variantes
    const variants = await query(
      `SELECT 
        v.*,
        vi.image_url as variant_image
       FROM product_variants v
       LEFT JOIN product_variant_images vi ON v.id = vi.variant_id AND vi.is_primary = 1
       WHERE v.product_id = ?
       ORDER BY v.sort_order ASC, v.created_at ASC`,
      [productId]
    );

    // Obtener imágenes para cada variante
    for (let variant of variants) {
      const images = await query(
        'SELECT * FROM product_variant_images WHERE variant_id = ? ORDER BY sort_order ASC',
        [variant.id]
      );
      variant.images = images;
    }

    res.status(200).json({
      success: true,
      data: {
        product,
        variants
      }
    });

  } catch (error) {
    console.error('Error obteniendo variantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function createVariant(req, res, productId) {
  try {
    const {
      name,
      sku,
      price,
      sale_price,
      stock_quantity,
      manage_stock = true,
      stock_status = 'in_stock',
      weight,
      dimensions,
      attributes = {},
      images = [],
      status = 'active'
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la variante es requerido'
      });
    }

    // Verificar que el producto existe
    const [product] = await query(
      'SELECT id FROM products WHERE id = ? AND status != "deleted"',
      [productId]
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar SKU único si se proporciona
    if (sku) {
      const [existingSku] = await query(
        'SELECT id FROM product_variants WHERE sku = ? AND product_id != ?',
        [sku, productId]
      );

      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'El SKU ya existe'
        });
      }
    }

    const result = await transaction(async (conn) => {
      // Crear variante
      const variantResult = await conn.query(
        `INSERT INTO product_variants (
          product_id, name, sku, price, sale_price, stock_quantity,
          manage_stock, stock_status, weight, dimensions, attributes,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          productId, name, sku || null, parseFloat(price) || 0,
          sale_price ? parseFloat(sale_price) : null,
          manage_stock ? parseInt(stock_quantity) || 0 : 0,
          manage_stock, stock_status, weight || null, dimensions || null,
          JSON.stringify(attributes), status
        ]
      );

      const variantId = variantResult.insertId;

      // Agregar imágenes si se proporcionan
      if (images.length > 0) {
        const imageInserts = images.map((img, index) => [
          variantId, img.image_url, img.alt_text || '',
          img.is_primary || (index === 0), img.sort_order || index
        ]);

        await conn.query(
          `INSERT INTO product_variant_images (variant_id, image_url, alt_text, is_primary, sort_order) VALUES ${
            imageInserts.map(() => '(?, ?, ?, ?, ?)').join(', ')
          }`,
          imageInserts.flat()
        );
      }

      return variantId;
    });

    res.status(201).json({
      success: true,
      message: 'Variante creada exitosamente',
      data: { variantId: result }
    });

  } catch (error) {
    console.error('Error creando variante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function updateVariants(req, res, productId) {
  try {
    const { variants } = req.body;

    if (!Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: 'Se esperaba un array de variantes'
      });
    }

    await transaction(async (conn) => {
      for (const variant of variants) {
        if (variant.id) {
          // Actualizar variante existente
          await conn.query(
            `UPDATE product_variants SET 
              name = ?, sku = ?, price = ?, sale_price = ?, stock_quantity = ?,
              manage_stock = ?, stock_status = ?, weight = ?, dimensions = ?,
              attributes = ?, status = ?, updated_at = NOW()
             WHERE id = ? AND product_id = ?`,
            [
              variant.name, variant.sku || null, parseFloat(variant.price) || 0,
              variant.sale_price ? parseFloat(variant.sale_price) : null,
              variant.manage_stock ? parseInt(variant.stock_quantity) || 0 : 0,
              variant.manage_stock, variant.stock_status,
              variant.weight || null, variant.dimensions || null,
              JSON.stringify(variant.attributes || {}),
              variant.status || 'active', variant.id, productId
            ]
          );

          // Actualizar imágenes
          if (variant.images) {
            await conn.query(
              'DELETE FROM product_variant_images WHERE variant_id = ?',
              [variant.id]
            );

            if (variant.images.length > 0) {
              const imageInserts = variant.images.map((img, index) => [
                variant.id, img.image_url, img.alt_text || '',
                img.is_primary || (index === 0), img.sort_order || index
              ]);

              await conn.query(
                `INSERT INTO product_variant_images (variant_id, image_url, alt_text, is_primary, sort_order) VALUES ${
                  imageInserts.map(() => '(?, ?, ?, ?, ?)').join(', ')
                }`,
                imageInserts.flat()
              );
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Variantes actualizadas exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando variantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function deleteVariants(req, res, productId) {
  try {
    const { variant_ids } = req.body;

    if (!Array.isArray(variant_ids) || variant_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren IDs de variantes para eliminar'
      });
    }

    await transaction(async (conn) => {
      const placeholders = variant_ids.map(() => '?').join(',');
      
      // Eliminar imágenes de variantes
      await conn.query(
        `DELETE FROM product_variant_images 
         WHERE variant_id IN (${placeholders})`,
        variant_ids
      );

      // Eliminar variantes
      await conn.query(
        `DELETE FROM product_variants 
         WHERE id IN (${placeholders}) AND product_id = ?`,
        [...variant_ids, productId]
      );
    });

    res.status(200).json({
      success: true,
      message: `${variant_ids.length} variante(s) eliminada(s) exitosamente`
    });

  } catch (error) {
    console.error('Error eliminando variantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}