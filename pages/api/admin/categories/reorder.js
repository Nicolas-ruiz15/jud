// pages/api/admin/categories/reorder.js
import { query, transaction } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { categories, parent_id = null } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de categorías'
      });
    }

    // Validar estructura de datos
    for (const cat of categories) {
      if (!cat.id || typeof cat.sort_order !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Cada categoría debe tener id y sort_order'
        });
      }
    }

    const result = await transaction(async (conn) => {
      const updated = [];

      // Actualizar el orden de cada categoría
      for (const category of categories) {
        await conn.query(
          `UPDATE categories 
           SET sort_order = ?, 
               parent_id = ?,
               updated_at = NOW() 
           WHERE id = ?`,
          [category.sort_order, parent_id, category.id]
        );

        updated.push({
          id: category.id,
          sort_order: category.sort_order,
          parent_id: parent_id
        });
      }

      return { updated, total: updated.length };
    });

    res.status(200).json({
      success: true,
      message: `${result.total} categoría(s) reordenada(s) exitosamente`,
      data: result
    });

  } catch (error) {
    console.error('Error reordenando categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export default adminAuth(handler);