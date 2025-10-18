// pages/api/debug/orders.js - API de debug para pedidos
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  let connection;
  const debugInfo = {
    step: 'inicio',
    timestamp: new Date().toISOString(),
    params: req.query,
    method: req.method
  };

  try {
    debugInfo.step = 'verificando método';
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false, 
        message: 'Método no permitido',
        debug: debugInfo
      });
    }

    debugInfo.step = 'verificando token';
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    debugInfo.hasToken = !!token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
        debug: debugInfo
      });
    }

    debugInfo.step = 'decodificando JWT';
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      debugInfo.userId = decoded.userId;
      debugInfo.tokenValid = true;
    } catch (error) {
      debugInfo.tokenError = error.message;
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        debug: debugInfo
      });
    }

    debugInfo.step = 'conectando a BD';
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });
    debugInfo.dbConnected = true;

    debugInfo.step = 'verificando usuario';
    const [userResult] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [decoded.userId, 'customer']
    );
    debugInfo.userFound = userResult.length > 0;

    if (userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
        debug: debugInfo
      });
    }

    debugInfo.step = 'verificando tablas';
    const [tablesCheck] = await connection.execute("SHOW TABLES LIKE 'orders'");
    debugInfo.ordersTableExists = tablesCheck.length > 0;

    if (tablesCheck.length === 0) {
      debugInfo.step = 'devolviendo datos de ejemplo';
      return res.status(200).json({
        success: true,
        message: 'Tabla orders no existe, devolviendo datos de ejemplo',
        data: [
          {
            id: 'demo-1',
            status: 'delivered',
            total: 120000,
            created_at: new Date('2024-01-15'),
            items_count: 3,
            items: [
              { name: 'Producto Demo 1', quantity: 2, price: 35000 },
              { name: 'Producto Demo 2', quantity: 1, price: 50000 }
            ]
          }
        ],
        debug: debugInfo
      });
    }

    debugInfo.step = 'contando pedidos';
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [decoded.userId]
    );
    debugInfo.totalOrders = countResult[0].total;

    debugInfo.step = 'obteniendo pedidos';
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [decoded.userId]
    );
    debugInfo.ordersFound = orders.length;

    debugInfo.step = 'verificando order_items';
    const [itemsTableCheck] = await connection.execute("SHOW TABLES LIKE 'order_items'");
    debugInfo.orderItemsTableExists = itemsTableCheck.length > 0;

    debugInfo.step = 'completado exitosamente';
    
    res.status(200).json({
      success: true,
      message: 'Debug completado',
      data: orders,
      debug: debugInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        dbConfig: {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          database: process.env.DB_NAME,
          hasPassword: !!process.env.DB_PASSWORD
        }
      }
    });

  } catch (error) {
    debugInfo.step = 'error capturado';
    debugInfo.error = {
      message: error.message,
      code: error.code,
      stack: error.stack
    };

    console.error('=== ERROR EN DEBUG API ===');
    console.error('Debug info:', debugInfo);
    console.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Error en debug',
      debug: debugInfo,
      error: {
        message: error.message,
        code: error.code
      }
    });

  } finally {
    if (connection) {
      await connection.end();
    }
  }
}