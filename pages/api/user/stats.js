// pages/api/user/stats.js - Estadísticas del usuario
import { verifyToken } from '../../../middleware/auth';
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    // Verificar autenticación usando el middleware
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                 req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Verificar que el usuario existe y es customer
    const userResult = await query(
      'SELECT id FROM users WHERE id = ? AND role = "customer"',
      [decoded.userId]
    );

    if (userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userId = decoded.userId;

    // Obtener estadísticas del usuario
    const statsQueries = await Promise.all([
      // Total de pedidos
      query(
        'SELECT COUNT(*) as totalOrders FROM orders WHERE user_id = ?',
        [userId]
      ),
      
      // Total gastado (suma de todos los pedidos completados)
      query(
        `SELECT COALESCE(SUM(total), 0) as totalSpent 
         FROM orders 
         WHERE user_id = ? AND status IN ('completed', 'delivered')`,
        [userId]
      ),

      // Categoría favorita (la categoría con más productos comprados)
      query(
        `SELECT c.name as category_name, COUNT(*) as purchase_count
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         JOIN products p ON oi.product_id = p.id
         JOIN product_categories pc ON p.id = pc.product_id
         JOIN categories c ON pc.category_id = c.id
         WHERE o.user_id = ? AND o.status IN ('completed', 'delivered')
         GROUP BY c.id, c.name
         ORDER BY purchase_count DESC
         LIMIT 1`,
        [userId]
      ),

      // Pedido más reciente para mostrar información adicional
      query(
        `SELECT status, created_at 
         FROM orders 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      )
    ]);

    const [ordersResult, spentResult, categoryResult, recentOrderResult] = statsQueries;

    // Procesar resultados
    const totalOrders = ordersResult[0]?.totalOrders || 0;
    const totalSpent = spentResult[0]?.totalSpent || 0;
    const favoriteCategory = categoryResult[0]?.category_name || 'N/A';
    const lastOrderStatus = recentOrderResult[0]?.status || null;
    const lastOrderDate = recentOrderResult[0]?.created_at || null;

    // Calcular información adicional
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    const stats = {
      orders: parseInt(totalOrders),
      totalSpent: parseFloat(totalSpent),
      favoriteCategory: favoriteCategory,
      averageOrderValue: parseFloat(averageOrderValue),
      lastOrderStatus: lastOrderStatus,
      lastOrderDate: lastOrderDate,
      // Agregar más estadísticas útiles
      isNewCustomer: totalOrders === 0,
      isVipCustomer: totalSpent > 500000, // VIP si ha gastado más de 500k
      loyaltyLevel: getLoyaltyLevel(totalSpent)
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Función helper para determinar nivel de lealtad
function getLoyaltyLevel(totalSpent) {
  if (totalSpent >= 1000000) return 'Diamante';
  if (totalSpent >= 500000) return 'Oro';
  if (totalSpent >= 200000) return 'Plata';
  if (totalSpent >= 50000) return 'Bronce';
  return 'Nuevo';
}