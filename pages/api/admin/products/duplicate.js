// pages/api/admin/products/duplicate.js
import { query, transaction } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { product_id, options = {} } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'ID del producto es requerido'
      });
    }

    const result = await transaction(async (conn) => {
      // Obtener producto original
      const [originalProduct] = await conn.query(
        'SELECT * FROM products WHERE id = ? AND status != "deleted"',
        [product_id]
      );

      if (!originalProduct) {
        throw new Error('Producto no encontrado');
      }

      // Generar nuevo nombre y slug
      const baseName = originalProduct.name;
      const baseSlug = originalProduct.slug;
      const baseSku = originalProduct.sku;
      
      let newName = options.name || `${baseName} (Copia)`;
      let newSlug = options.slug || `${baseSlug}-copia`;
      let newSku = options.sku || (baseSku ? `${baseSku}-COPY` : null);

      // Verificar que el slug no exista
      let slugCounter = 1;
      let finalSlug = newSlug;
      while (true) {
        const [existingProduct] = await conn.query(
          'SELECT id FROM products WHERE slug = ? AND status != "deleted"',
          [finalSlug]
        );
        
        if (!existingProduct) break;
        
        finalSlug = `${newSlug}-${slugCounter}`;
        slugCounter++;
      }

      // Verificar que el SKU no exista (si se proporciona)
      if (newSku) {
        let skuCounter = 1;
        let finalSku = newSku;
        while (true) {
          const [existingProduct] = await conn.query(
            'SELECT id FROM products WHERE sku = ? AND status != "deleted"',
            [finalSku]
          );
          
          if (!existingProduct) break;
          
          finalSku = `${newSku}-${skuCounter}`;
          skuCounter++;
        }
        newSku = finalSku;
      }

      // Crear nuevo producto
      const productData = {
        ...originalProduct,
        name: newName,
        slug: finalSlug,
        sku: newSku,
        featured: options.copyFeatured !== false ? originalProduct.featured : false,
        status: options.status || 'draft',
        stock_quantity: options.resetStock ? 0 : originalProduct.stock_quantity,
        created_at: new Date(),
        updated_at: new Date()
      };

      delete productData.id;

      const insertResult = await conn.query(
        `INSERT INTO products (
          name, slug, description, short_description, price, sale_price, sku,
          stock_quantity, manage_stock, stock_status, weight, dimensions,
          featured, status, meta_title, meta_description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productData.name, productData.slug, productData.description, 
          productData.short_description, productData.price, productData.sale_price,
          productData.sku, productData.stock_quantity, productData.manage_stock,
          productData.stock_status, productData.weight, productData.dimensions,
          productData.featured, productData.status, productData.meta_title,
          productData.meta_description, productData.created_at, productData.updated_at
        ]
      );

      const newProductId = insertResult.insertId;

      // Copiar categorías si se especifica
      if (options.copyCategories !== false) {
        const categories = await conn.query(
          'SELECT category_id FROM product_categories WHERE product_id = ?',
          [product_id]
        );

        if (categories.length > 0) {
          const categoryInserts = categories.map(cat => [newProductId, cat.category_id]);
          await conn.query(
            `INSERT INTO product_categories (product_id, category_id) VALUES ${
              categoryInserts.map(() => '(?, ?)').join(', ')
            }`,
            categoryInserts.flat()
          );
        }
      }

      // Copiar imágenes si se especifica
      if (options.copyImages !== false) {
        const images = await conn.query(
          'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
          [product_id]
        );

        if (images.length > 0) {
          const imageInserts = images.map(img => [
            newProductId, img.image_url, img.alt_text, 
            img.is_featured, img.sort_order
          ]);
          await conn.query(
            `INSERT INTO product_images (product_id, image_url, alt_text, is_featured, sort_order) VALUES ${
              imageInserts.map(() => '(?, ?, ?, ?, ?)').join(', ')
            }`,
            imageInserts.flat()
          );
        }
      }

      return {
        newProductId,
        originalProduct: originalProduct.name,
        newProduct: newName,
        newSlug: finalSlug,
        newSku
      };
    });

    res.status(201).json({
      success: true,
      message: 'Producto duplicado exitosamente',
      data: result
    });

  } catch (error) {
    console.error('Error duplicando producto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
}