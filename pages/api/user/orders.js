// pages/api/user/orders.js - COMPATIBLE con tu estructura de BD
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  let connection;

  try {
    // Verificar autenticación
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                 req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Crear conexión directa
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('=== DEBUG USER ORDERS API ===');
    console.log('Usuario ID:', decoded.userId);

    // Verificar que el usuario existe
    const [userResult] = await connection.execute(
      'SELECT id, email FROM users WHERE id = ? AND role = ?',
      [decoded.userId, 'customer']
    );

    if (userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = userResult[0];
    console.log('Usuario encontrado:', user.email);

    // Parámetros de consulta
    const filter = req.query.filter || 'all';
    const sort = req.query.sort || 'date_desc';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    console.log('Parámetros:', { filter, sort, limit, page, offset });

    // Verificar si existe la tabla orders (como en tu admin)
    const [tablesCheck] = await connection.execute("SHOW TABLES LIKE 'orders'");
    console.log('Tabla orders existe:', tablesCheck.length > 0);
    
    if (tablesCheck.length === 0) {
      console.log('Tabla orders no existe, devolviendo datos de ejemplo...');
      return res.status(200).json({
        success: true,
        data: [
          {
            id: 'demo-1',
            order_number: 'JBC-001',
            status: 'delivered',
            total: 120000,
            created_at: new Date('2024-01-15'),
            items_count: 3,
            customer_name: user.email,
            items: [
              { name: 'Kipá Bordada', quantity: 2, price: 35000, image_url: null },
              { name: 'Mezuzá de Plata', quantity: 1, price: 50000, image_url: null }
            ],
            canCancel: false,
            canTrack: false,
            isCompleted: true,
            needsAttention: false,
            hasTracking: false,
            daysSinceOrder: 15
          }
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasMore: false,
          filter: 'all'
        }
      });
    }

    // Verificar estructura de la tabla orders
    const [tableStructure] = await connection.execute('DESCRIBE `orders`');
    const columns = tableStructure.map(col => col.Field);
    console.log('Columnas en tabla orders:', columns);

    // Construir condición WHERE para filtro
    let statusCondition = '';
    let statusParams = [];
    
    if (filter === 'processing') {
      statusCondition = 'AND o.status IN (?, ?)';
      statusParams = ['pending', 'processing'];
    } else if (filter === 'shipped') {
      statusCondition = 'AND o.status IN (?, ?)';
      statusParams = ['shipped', 'out_for_delivery'];
    } else if (filter === 'delivered') {
      statusCondition = 'AND o.status IN (?, ?)';
      statusParams = ['delivered', 'completed'];
    } else if (filter === 'cancelled') {
      statusCondition = 'AND o.status IN (?, ?, ?)';
      statusParams = ['cancelled', 'refunded', 'failed'];
    } else if (filter !== 'all') {
      statusCondition = 'AND o.status = ?';
      statusParams = [filter];
    }

    // Construir ORDER BY
    let orderByClause = 'ORDER BY o.created_at DESC';
    if (sort === 'date_asc') {
      orderByClause = 'ORDER BY o.created_at ASC';
    } else if (sort === 'total_desc') {
      // Usar total_amount si existe, sino total
      const totalField = columns.includes('total_amount') ? 'total_amount' : 'total';
      orderByClause = `ORDER BY o.${totalField} DESC, o.created_at DESC`;
    } else if (sort === 'total_asc') {
      const totalField = columns.includes('total_amount') ? 'total_amount' : 'total';
      orderByClause = `ORDER BY o.${totalField} ASC, o.created_at DESC`;
    }

    // Determinar qué campos usar basado en tu estructura
    const orderNumberField = columns.includes('order_number') ? 'order_number' : 'id';
    const totalField = columns.includes('total_amount') ? 'total_amount' : 'total';
    const emailField = columns.includes('customer_email') ? 'customer_email' : 
                      columns.includes('user_id') ? 'user_id' : 'id';

    // Query adaptado a tu estructura
    const ordersQuery = `
      SELECT 
        o.id,
        ${columns.includes('order_number') ? 'o.order_number,' : ''}
        o.status,
        o.${totalField} as total,
        o.created_at,
        o.updated_at,
        ${columns.includes('customer_email') ? 'o.customer_email,' : ''}
        ${columns.includes('billing_address') ? 'o.billing_address,' : ''}
        ${columns.includes('shipping_address') ? 'o.shipping_address,' : ''}
        ${columns.includes('payment_status') ? 'o.payment_status,' : ''}
        ${columns.includes('tracking_number') ? 'o.tracking_number,' : ''}
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM \`orders\` o
      WHERE ${columns.includes('customer_email') ? 'o.customer_email = ?' : 
               columns.includes('user_id') ? 'o.user_id = ?' : '1=1'} ${statusCondition}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    // Parámetros de query
    let queryParams = [];
    if (columns.includes('customer_email')) {
      queryParams.push(user.email);
    } else if (columns.includes('user_id')) {
      queryParams.push(decoded.userId);
    }
    queryParams.push(...statusParams, limit, offset);

    console.log('Ejecutando query:', ordersQuery);
    console.log('Parámetros:', queryParams);

    const [orders] = await connection.execute(ordersQuery, queryParams);
    console.log('Pedidos encontrados:', orders.length);

    // Para cada pedido, obtener items
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        let items = [];
        let customerName = '';

        // Extraer nombre del cliente
        if (order.billing_address) {
          try {
            const billingAddr = JSON.parse(order.billing_address);
            customerName = `${billingAddr.first_name || ''} ${billingAddr.last_name || ''}`.trim() || 'Cliente';
          } catch (e) {
            customerName = order.customer_email || user.email;
          }
        } else {
          customerName = order.customer_email || user.email;
        }

        // Obtener items del pedido
        try {
          const [orderItems] = await connection.execute(
            `SELECT 
              oi.id,
              oi.quantity,
              oi.price,
              oi.product_name as name,
              ${columns.includes('product_id') ? 'oi.product_id,' : ''}
              '' as slug,
              '' as image_url
            FROM order_items oi
            WHERE oi.order_id = ?
            ORDER BY oi.id`,
            [order.id]
          );

          items = orderItems.map(item => ({
            id: item.id,
            name: item.name || `Producto ${item.product_id || 'N/A'}`,
            slug: item.slug || '',
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            image_url: item.image_url,
            subtotal: parseFloat(item.price) * parseInt(item.quantity)
          }));
        } catch (itemError) {
          console.error('Error obteniendo items:', itemError);
        }

        // Determinar acciones disponibles
        const canCancel = ['pending', 'processing'].includes(order.status);
        const canTrack = ['shipped', 'out_for_delivery'].includes(order.status);
        const isCompleted = ['delivered', 'completed'].includes(order.status);
        const needsAttention = ['failed', 'cancelled', 'refunded'].includes(order.status);

        return {
          id: order.id,
          order_number: order.order_number || `JBC-${order.id}`,
          status: order.status,
          total: parseFloat(order.total),
          created_at: order.created_at,
          updated_at: order.updated_at,
          customer_name: customerName,
          customer_email: order.customer_email || user.email,
          payment_status: order.payment_status || 'unknown',
          tracking_number: order.tracking_number || null,
          items: items,
          items_count: parseInt(order.items_count || items.length),
          // Flags para acciones
          canCancel,
          canTrack,
          isCompleted,
          needsAttention,
          hasTracking: !!order.tracking_number,
          daysSinceOrder: Math.floor((new Date() - new Date(order.created_at)) / (1000 * 60 * 60 * 24))
        };
      })
    );

    // Contar total para paginación
    const totalCountQuery = `
      SELECT COUNT(*) as total
      FROM \`orders\` o
      WHERE ${columns.includes('customer_email') ? 'o.customer_email = ?' : 
               columns.includes('user_id') ? 'o.user_id = ?' : '1=1'} ${statusCondition}
    `;
    
    let totalParams = [];
    if (columns.includes('customer_email')) {
      totalParams.push(user.email);
    } else if (columns.includes('user_id')) {
      totalParams.push(decoded.userId);
    }
    totalParams.push(...statusParams);

    const [totalResult] = await connection.execute(totalCountQuery, totalParams);
    const totalOrders = totalResult[0]?.total || 0;

    console.log('Total de pedidos:', totalOrders);

    res.status(200).json({
      success: true,
      data: ordersWithItems,
      meta: {
        total: parseInt(totalOrders),
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalOrders / limit),
        hasMore: ordersWithItems.length === limit && page * limit < totalOrders,
        filter: filter,
        sort: sort
      }
    });

  } catch (error) {
    console.error('=== ERROR EN API DE PEDIDOS USUARIO ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });

  } finally {
    if (connection) {
      await connection.end();
    }
  }
}