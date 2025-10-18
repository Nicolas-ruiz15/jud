import { query } from '../../../lib/database';
import { v4 as uuidv4 } from 'uuid';
import { sendOrderConfirmationEmail } from '../../../lib/emailService';
import { getOrderConfirmationEmailTemplate } from '../../../lib/emailTemplates';

const SESSION_COOKIE_NAME = 'judaica_session_id';

// Helper mejorado para obtener session ID
const getSessionId = (req) => {
  const cookieHeader = req.headers.cookie || '';
  console.log('🍪 Raw cookie header:', cookieHeader);
  
  if (!cookieHeader) {
    console.log('❌ No cookie header found');
    return null;
  }
  
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...v] = c.trim().split('=');
      return [key, decodeURIComponent(v.join('='))];
    })
  );
  
  const sessionId = cookies[SESSION_COOKIE_NAME];
  console.log('🔑 Extracted session ID:', sessionId);
  console.log('🍪 All cookies:', cookies);
  
  return sessionId;
};

// Generar número de orden único
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `JBC-${timestamp}-${random}`.toUpperCase();
};

// POST - Crear nueva orden CON VALIDACIONES MEJORADAS
async function createOrder(req, res) {
  console.log('🚀 Iniciando creación de orden...');
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  
  const sessionId = getSessionId(req);
  
  if (!sessionId) {
    console.log('❌ No session ID found');
    return res.status(400).json({
      success: false,
      message: 'Sesión requerida para crear pedido. Por favor recarga la página.',
      debug: 'Missing session cookie'
    });
  }

  const {
    customer_data,
    shipping_address,
    billing_address,
    payment_method = 'pending',
    notes = ''
  } = req.body;

  console.log('📋 Order data received:', { 
    customer_email: customer_data?.email, 
    payment_method,
    session_id: sessionId 
  });

  // Validaciones mejoradas
  if (!customer_data?.email || !customer_data?.name) {
    return res.status(400).json({
      success: false,
      message: 'Datos del cliente requeridos (nombre y email)'
    });
  }

  if (!shipping_address?.address || !shipping_address?.city) {
    return res.status(400).json({
      success: false,
      message: 'Dirección de envío requerida (dirección y ciudad)'
    });
  }

  try {
    // 1. VERIFICAR CARRITO CON MEJOR DEBUGGING
    console.log('🛒 Buscando items del carrito para session:', sessionId);
    
    const cartItems = await query(`
      SELECT 
        ci.id,
        ci.product_id,
        ci.quantity,
        p.name,
        p.slug,
        p.price,
        p.sale_price,
        p.stock_quantity,
        p.manage_stock,
        p.stock_status,
        COALESCE(p.weight, 0) as weight
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = ? AND p.status = 'active'
    `, [sessionId]);

    console.log('🛒 Cart items found:', cartItems.length);
    
    if (cartItems.length === 0) {
      // DEBUGGING ADICIONAL
      const allCartItems = await query('SELECT session_id, COUNT(*) as count FROM cart_items GROUP BY session_id');
      console.log('🔍 All cart sessions in DB:', allCartItems);
      
      const currentSessionItems = await query('SELECT * FROM cart_items WHERE session_id = ?', [sessionId]);
      console.log('🔍 Items for current session:', currentSessionItems);
      
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío. Por favor agrega productos antes de continuar.',
        debug: {
          sessionId,
          totalSessions: allCartItems.length,
          currentSessionItems: currentSessionItems.length
        }
      });
    }

    // 2. Validar stock y calcular totales
    let subtotal = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      console.log('🔍 Validating item:', item.name, 'qty:', item.quantity);
      
      // Validar stock
      if (item.manage_stock && item.stock_status !== 'in_stock') {
        return res.status(400).json({
          success: false,
          message: `${item.name} está fuera de stock`
        });
      }

      if (item.manage_stock && item.quantity > item.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: `Solo hay ${item.stock_quantity} unidades de ${item.name} disponibles`
        });
      }

      // Calcular precio
      const price = item.sale_price || item.price;
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      
      validatedItems.push({
        ...item,
        final_price: price,
        line_total: lineTotal
      });
    }

    console.log('💰 Subtotal calculado:', subtotal);

    // 3. Calcular envío y totales
    const FREE_SHIPPING_THRESHOLD = 250000;
    const SHIPPING_COST = 18000;
    const shipping_amount = (payment_method === 'bank_transfer' || subtotal >= FREE_SHIPPING_THRESHOLD) ? 0 : SHIPPING_COST;
    const tax_rate = 0;
    const tax_amount = 0;
    const total_amount = subtotal + shipping_amount + tax_amount;

    console.log('🧮 Final calculations:', { 
      subtotal, 
      shipping_amount, 
      tax_amount, 
      total_amount 
    });

    // 4. Crear la orden
    const order_number = generateOrderNumber();
    const nameParts = customer_data.name.trim().split(' ');
    const customer_first_name = nameParts[0] || '';
    const customer_last_name = nameParts.slice(1).join(' ') || '';
    
    console.log('📝 Creating order:', order_number);
    
    const orderResult = await query(`
      INSERT INTO orders (
        order_number,
        user_id,
        session_id,
        status,
        payment_status,
        payment_method,
        subtotal,
        tax_amount,
        shipping_amount,
        total_amount,
        currency,
        customer_email,
        customer_first_name,
        customer_last_name,
        customer_phone,
        shipping_address,
        billing_address,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      order_number,
      req.user?.id || null,
      sessionId,
      'pending',
      'pending',
      payment_method,
      subtotal,
      tax_amount,
      shipping_amount,
      total_amount,
      'COP',
      customer_data.email,
      customer_first_name,
      customer_last_name,
      customer_data.phone || null,
      JSON.stringify(shipping_address),
      JSON.stringify(billing_address || shipping_address),
      notes
    ]);

    const orderId = orderResult.insertId;
    console.log('✅ Order created with ID:', orderId);

    // 5. Crear items de la orden
    for (const item of validatedItems) {
      await query(`
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          price,
          total,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        orderId,
        item.product_id,
        item.name,
        item.quantity,
        item.final_price,
        item.line_total
      ]);
    }

    console.log('📦 Order items created');

    // 6. ENVIAR EMAIL PARA TRANSFERENCIA BANCARIA
    if (payment_method === 'bank_transfer') {
      try {
        console.log('📧 Enviando email de confirmación...');
        console.log('📧 Email destino:', customer_data.email);
        console.log('📧 Orden:', order_number);
        
        const orderDetails = {
          order_number,
          total_amount,
          items: validatedItems.map(item => ({
            product_name: item.name,
            quantity: item.quantity,
            price: item.final_price
          })),
          shipping_address,
          notes
        };

        const customerDetails = {
          name: customer_data.name,
          email: customer_data.email
        };

        console.log('📧 Generando plantilla...');
        const emailResult = await sendOrderConfirmationEmail(orderDetails, customerDetails);
        
        console.log('✅ Email de confirmación enviado:', emailResult);
      } catch (emailError) {
        console.error('❌ ERROR COMPLETO enviando email:', emailError);
        console.error('❌ Stack:', emailError.stack);
        console.error('❌ Message:', emailError.message);
      }
    }

    // 7. Limpiar carrito
    console.log('🧹 Limpiando carrito...');
    const deleteResult = await query('DELETE FROM cart_items WHERE session_id = ?', [sessionId]);
    console.log('🧹 Cart cleared, rows affected:', deleteResult.affectedRows);

    const result = {
      order_id: orderId,
      order_number,
      total_amount,
      items_count: validatedItems.length,
      payment_method,
      customer_email: customer_data.email,
      customer_name: customer_data.name,
      shipping_address,
      subtotal,
      tax_amount,
      shipping_amount
    };

    console.log('✅ Order creation successful:', order_number);

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: result
    });

  } catch (error) {
    console.error('💥 Error creando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al crear el pedido',
      debug: process.env.NODE_ENV === 'development' ? {
        error: error.message,
        stack: error.stack.split('\n').slice(0, 5)
      } : undefined
    });
  }
}

// GET - Obtener pedidos (sin cambios)
async function getOrders(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];

    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 }
      });
    }

    whereClause = 'WHERE session_id = ?';
    params.push(sessionId);

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const countQuery = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    const ordersQuery = `
      SELECT 
        id, order_number, status, payment_status, payment_method,
        subtotal, tax_amount, shipping_amount, total_amount, currency,
        customer_first_name, customer_last_name, customer_email,
        created_at, updated_at
      FROM orders 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const orders = await query(ordersQuery, [...params, parseInt(limit), offset]);

    const ordersWithFullName = orders.map(order => ({
      ...order,
      customer_name: `${order.customer_first_name} ${order.customer_last_name}`.trim()
    }));

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: ordersWithFullName,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los pedidos'
    });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log(`🌐 ${req.method} request to /api/orders`);

  try {
    switch (req.method) {
      case 'POST':
        return await createOrder(req, res);
      case 'GET':
        return await getOrders(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          message: `Método ${req.method} no permitido`
        });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}