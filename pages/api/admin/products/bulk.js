import { query, transaction } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { action, product_ids } = req.body;

    if (!action || !product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Acción y IDs de productos son requeridos'
      });
    }

    const placeholders = product_ids.map(() => '?').join(',');

    switch (action) {
      case 'delete':
        await transaction(async (conn) => {
          // Eliminar relaciones
          await conn.query(`DELETE FROM product_categories WHERE product_id IN (${placeholders})`, product_ids);
          await conn.query(`DELETE FROM product_images WHERE product_id IN (${placeholders})`, product_ids);
          await conn.query(`DELETE FROM cart_items WHERE product_id IN (${placeholders})`, product_ids);
          
          // Soft delete
          await conn.query(`UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id IN (${placeholders})`, product_ids);
        });
        break;

      case 'activate':
        await query(`UPDATE products SET status = 'active', updated_at = NOW() WHERE id IN (${placeholders})`, product_ids);
        break;

      case 'deactivate':
        await query(`UPDATE products SET status = 'inactive', updated_at = NOW() WHERE id IN (${placeholders})`, product_ids);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Acción no válida'
        });
    }

    res.status(200).json({
      success: true,
      message: `Acción ${action} ejecutada exitosamente en ${product_ids.length} productos`
    });
	  try {
  await res.revalidate('/');
  await res.revalidate('/productos');
} catch (revalidateError) {
  console.warn('Error revalidating after bulk action:', revalidateError);
}

  } catch (error) {
    console.error('Error en acción masiva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}