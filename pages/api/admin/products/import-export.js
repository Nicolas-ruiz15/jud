// pages/api/admin/products/import-export.js
import { query, transaction } from '../../../../lib/database';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

export default async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      return await importProducts(req, res);
    case 'GET':
      return await exportProducts(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
}

async function exportProducts(req, res) {
  try {
    const {
      format = 'csv',
      include_images = 'false',
      include_categories = 'false',
      status,
      category_ids,
      featured
    } = req.query;

    // Construir filtros
    const conditions = ['p.status != "deleted"'];
    const params = [];

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (featured) {
      conditions.push('p.featured = ?');
      params.push(featured === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query base
    let exportQuery = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.short_description,
        p.price,
        p.sale_price,
        p.sku,
        p.stock_quantity,
        p.manage_stock,
        p.stock_status,
        p.weight,
        p.dimensions,
        p.featured,
        p.status,
        p.meta_title,
        p.meta_description,
        p.created_at,
        p.updated_at
      FROM products p
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    const products = await query(exportQuery, params);

    // Obtener datos adicionales si se solicita
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const enriched = { ...product };

        // Incluir imágenes
        if (include_images === 'true') {
          const images = await query(
            'SELECT image_url, alt_text, is_featured, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order',
            [product.id]
          );
          enriched.images = images.map(img => ({
            url: img.image_url,
            alt: img.alt_text,
            featured: img.is_featured,
            order: img.sort_order
          }));
          enriched.featured_image = images.find(img => img.is_featured)?.image_url || images[0]?.image_url || '';
          enriched.image_count = images.length;
        }

        // Incluir categorías
        if (include_categories === 'true') {
          const categories = await query(
            `SELECT c.name, c.slug 
             FROM categories c 
             INNER JOIN product_categories pc ON c.id = pc.category_id 
             WHERE pc.product_id = ?`,
            [product.id]
          );
          enriched.categories = categories.map(cat => cat.name).join(', ');
          enriched.category_slugs = categories.map(cat => cat.slug).join(', ');
        }

        return enriched;
      })
    );

    // Formatear para exportación
    const exportData = enrichedProducts.map(product => ({
      'ID': product.id,
      'Nombre': product.name,
      'Slug': product.slug,
      'Descripción': product.description || '',
      'Descripción Corta': product.short_description || '',
      'Precio': product.price,
      'Precio Oferta': product.sale_price || '',
      'SKU': product.sku || '',
      'Stock': product.stock_quantity || 0,
      'Gestionar Stock': product.manage_stock ? 'Sí' : 'No',
      'Estado Stock': product.stock_status,
      'Peso': product.weight || '',
      'Dimensiones': product.dimensions || '',
      'Destacado': product.featured ? 'Sí' : 'No',
      'Estado': product.status,
      'Meta Título': product.meta_title || '',
      'Meta Descripción': product.meta_description || '',
      'Categorías': product.categories || '',
      'Imagen Principal': product.featured_image || '',
      'Total Imágenes': product.image_count || 0,
      'Fecha Creación': product.created_at,
      'Última Actualización': product.updated_at
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="productos-${new Date().toISOString().split('T')[0]}.json"`);
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
      res.setHeader('Content-Disposition', `attachment; filename="productos-${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send('\ufeff' + csvData); // BOM for UTF-8
    }

  } catch (error) {
    console.error('Error exportando productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function importProducts(req, res) {
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
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        try {
          // Validar campos requeridos
          if (!record.Nombre || !record.Precio) {
            results.errors.push({
              row: i + 1,
              error: 'Nombre y Precio son requeridos'
            });
            continue;
          }

          // Generar slug si no existe
          let slug = record.Slug || generateSlug(record.Nombre);
          
          // Verificar slug único
          let slugCounter = 1;
          let finalSlug = slug;
          while (true) {
            const [existing] = await conn.query(
              'SELECT id FROM products WHERE slug = ? AND status != "deleted"',
              [finalSlug]
            );
            
            if (!existing) break;
            
            finalSlug = `${slug}-${slugCounter}`;
            slugCounter++;
          }

          // Preparar datos del producto
          const productData = {
            name: record.Nombre,
            slug: finalSlug,
            description: record.Descripción || '',
            short_description: record['Descripción Corta'] || '',
            price: parseFloat(record.Precio) || 0,
            sale_price: record['Precio Oferta'] ? parseFloat(record['Precio Oferta']) : null,
            sku: record.SKU || null,
            stock_quantity: parseInt(record.Stock) || 0,
            manage_stock: record['Gestionar Stock'] === 'Sí',
            stock_status: record['Estado Stock'] || 'in_stock',
            weight: record.Peso ? parseFloat(record.Peso) : null,
            dimensions: record.Dimensiones || null,
            featured: record.Destacado === 'Sí',
            status: record.Estado || 'draft',
            meta_title: record['Meta Título'] || '',
            meta_description: record['Meta Descripción'] || ''
          };

          // Verificar si existe por ID o SKU
          let existingProduct = null;
          if (record.ID) {
            [existingProduct] = await conn.query(
              'SELECT id FROM products WHERE id = ? AND status != "deleted"',
              [record.ID]
            );
          } else if (record.SKU) {
            [existingProduct] = await conn.query(
              'SELECT id FROM products WHERE sku = ? AND status != "deleted"',
              [record.SKU]
            );
          }

          if (existingProduct && options.update_existing) {
            // Actualizar producto existente
            await conn.query(`
              UPDATE products SET 
                name = ?, slug = ?, description = ?, short_description = ?, 
                price = ?, sale_price = ?, sku = ?, stock_quantity = ?, 
                manage_stock = ?, stock_status = ?, weight = ?, dimensions = ?,
                featured = ?, status = ?, meta_title = ?, meta_description = ?,
                updated_at = NOW()
              WHERE id = ?
            `, [
              productData.name, productData.slug, productData.description,
              productData.short_description, productData.price, productData.sale_price,
              productData.sku, productData.stock_quantity, productData.manage_stock,
              productData.stock_status, productData.weight, productData.dimensions,
              productData.featured, productData.status, productData.meta_title,
              productData.meta_description, existingProduct.id
            ]);

            results.updated++;
          } else if (!existingProduct) {
            // Crear nuevo producto
            await conn.query(`
              INSERT INTO products (
                name, slug, description, short_description, price, sale_price, sku,
                stock_quantity, manage_stock, stock_status, weight, dimensions,
                featured, status, meta_title, meta_description, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
              productData.name, productData.slug, productData.description,
              productData.short_description, productData.price, productData.sale_price,
              productData.sku, productData.stock_quantity, productData.manage_stock,
              productData.stock_status, productData.weight, productData.dimensions,
              productData.featured, productData.status, productData.meta_title,
              productData.meta_description
            ]);

            results.imported++;
          } else {
            results.errors.push({
              row: i + 1,
              error: 'Producto ya existe y actualización no habilitada'
            });
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
    console.error('Error importando productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
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