// pages/api/admin/products/[id]/reviews.js
import { query, transaction } from '../../../../../lib/database';

export default async function handler(req, res) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return await getReviews(req, res, id);
    case 'POST':
      return await createReview(req, res, id);
    case 'PUT':
      return await updateReview(req, res, id);
    case 'DELETE':
      return await deleteReview(req, res, id);
    default:
      return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
}

async function getReviews(req, res, productId) {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      rating,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

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

    // Construir filtros
    const conditions = ['r.product_id = ?'];
    const params = [productId];

    if (status !== 'all') {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (rating) {
      conditions.push('r.rating = ?');
      params.push(parseInt(rating));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Obtener reseñas
    const reviewsQuery = `
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.${sort} ${order}
      LIMIT ? OFFSET ?
    `;

    const reviews = await query(reviewsQuery, [...params, parseInt(limit), offset]);

    // Contar total de reseñas
    const countQuery = `
      SELECT COUNT(*) as total
      FROM product_reviews r
      ${whereClause}
    `;
    const [{ total }] = await query(countQuery, params);

    // Obtener estadísticas de reseñas
    const statsQuery = `
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reviews,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reviews
      FROM product_reviews
      WHERE product_id = ?
    `;
    const [stats] = await query(statsQuery, [productId]);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: parseInt(page) * parseInt(limit) < total,
      hasPrevPage: parseInt(page) > 1
    };

    res.status(200).json({
      success: true,
      data: {
        product,
        reviews,
        stats: {
          ...stats,
          average_rating: parseFloat(stats.average_rating || 0).toFixed(1),
          rating_distribution: {
            5: stats.five_star || 0,
            4: stats.four_star || 0,
            3: stats.three_star || 0,
            2: stats.two_star || 0,
            1: stats.one_star || 0
          }
        },
        pagination
      }
    });

  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function createReview(req, res, productId) {
  try {
    const {
      user_id,
      rating,
      title,
      comment,
      status = 'pending',
      verified_purchase = false
    } = req.body;

    if (!user_id || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Usuario, calificación y comentario son requeridos'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 5'
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

    // Verificar que el usuario no haya reseñado ya este producto
    const [existingReview] = await query(
      'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?',
      [productId, user_id]
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya ha reseñado este producto'
      });
    }

    // Crear reseña
    const result = await query(
      `INSERT INTO product_reviews (
        product_id, user_id, rating, title, comment, status, 
        verified_purchase, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [productId, user_id, rating, title || null, comment, status, verified_purchase]
    );

    res.status(201).json({
      success: true,
      message: 'Reseña creada exitosamente',
      data: { reviewId: result.insertId }
    });

  } catch (error) {
    console.error('Error creando reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function updateReview(req, res, productId) {
  try {
    const { review_id, status, admin_response } = req.body;

    if (!review_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de reseña requerido'
      });
    }

    // Verificar que la reseña existe y pertenece al producto
    const [review] = await query(
      'SELECT id FROM product_reviews WHERE id = ? AND product_id = ?',
      [review_id, productId]
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }

    // Actualizar reseña
    const updateFields = [];
    const updateParams = [];

    if (status) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }

    if (admin_response !== undefined) {
      updateFields.push('admin_response = ?');
      updateParams.push(admin_response);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateParams.push(review_id);

    await query(
      `UPDATE product_reviews SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    res.status(200).json({
      success: true,
      message: 'Reseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function deleteReview(req, res, productId) {
  try {
    const { review_id } = req.body;

    if (!review_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de reseña requerido'
      });
    }

    // Verificar que la reseña existe y pertenece al producto
    const [review] = await query(
      'SELECT id FROM product_reviews WHERE id = ? AND product_id = ?',
      [review_id, productId]
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }

    // Eliminar reseña
    await query('DELETE FROM product_reviews WHERE id = ?', [review_id]);

    res.status(200).json({
      success: true,
      message: 'Reseña eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}