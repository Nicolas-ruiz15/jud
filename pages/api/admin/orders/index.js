// /pages/api/admin/orders/index.js - API COMPLETA REESTRUCTURADA
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const {
      page = 1,
      limit = 20,
      status,
      payment_status,
      search,
      date_from,
      date_to
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = [];
    let params = [];

    // Filtros
    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (payment_status) {
      conditions.push('o.payment_status = ?');
      params.push(payment_status);
    }
    if (date_from) {
      conditions.push('DATE(o.created_at) >= ?');
      params.push(date_from);
    }
    if (date_to) {
      conditions.push('DATE(o.created_at) <= ?');
      params.push(date_to);
    }

    // ✅ BÚSQUEDA MEJORADA - Campos directos + JSON como fallback
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(`(
        o.order_number LIKE ? OR 
        o.customer_email LIKE ? OR
        o.customer_first_name LIKE ? OR
        o.customer_last_name LIKE ? OR
        o.customer_phone LIKE ? OR
        CONCAT(COALESCE(o.customer_first_name, ''), ' ', COALESCE(o.customer_last_name, '')) LIKE ? OR
        JSON_UNQUOTE(JSON_EXTRACT(o.billing_address, '$.first_name')) LIKE ? OR
        JSON_UNQUOTE(JSON_EXTRACT(o.billing_address, '$.last_name')) LIKE ? OR
        JSON_UNQUOTE(JSON_EXTRACT(o.billing_address, '$.email')) LIKE ? OR
        JSON_UNQUOTE(JSON_EXTRACT(o.billing_address, '$.phone')) LIKE ?
      )`);
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM \`orders\` o ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    // ✅ CONSULTA COMPLETA - TODOS LOS CAMPOS RELEVANTES
    const ordersQuery = `
      SELECT 
        o.id,
        o.user_id,
        o.order_number,
        o.status,
        o.total_amount,
        o.subtotal,
        o.tax_amount,
        o.shipping_amount,
        o.discount_amount,
        o.payment_method,
        o.payment_status,
        o.payment_reference,
        o.epayco_transaction_id,
        o.created_at,
        o.updated_at,
        o.date_created,
        o.date_modified,
        o.date_paid,
        o.date_completed,
        o.currency,
        o.created_via,
        o.woocommerce_id,
        o.customer_email,
        o.customer_first_name,
        o.customer_last_name,
        o.customer_phone,
        o.customer_ip_address,
        o.billing_address,
        o.shipping_address,
        o.notes,
        o.admin_notes,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as total_items,
        (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) as total_quantity
      FROM \`orders\` o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const orders = await query(ordersQuery, [...params, parseInt(limit), offset]);
    
    // ✅ PROCESAMIENTO COMPLETO
    const processedOrders = orders.map(order => {
      let billingAddress = {};
      let shippingAddress = {};
      
      // Parsear JSON de forma segura
      try {
        if (order.billing_address && typeof order.billing_address === 'string') {
          billingAddress = JSON.parse(order.billing_address);
        }
      } catch (e) {
        console.error(`Error parsing billing_address for order ${order.id}:`, e.message);
      }
      
      try {
        if (order.shipping_address && typeof order.shipping_address === 'string') {
          shippingAddress = JSON.parse(order.shipping_address);
        }
      } catch (e) {
        console.error(`Error parsing shipping_address for order ${order.id}:`, e.message);
      }
      
      // ✅ INFORMACIÓN ROBUSTA DEL CLIENTE
      const firstName = order.customer_first_name || billingAddress.first_name || '';
      const lastName = order.customer_last_name || billingAddress.last_name || '';
      const customerName = `${firstName} ${lastName}`.trim() || 'Cliente invitado';
      const customerEmail = order.customer_email || billingAddress.email || 'No disponible';
      const customerPhone = order.customer_phone || billingAddress.phone || shippingAddress.phone || '';
      
      // ✅ INFORMACIÓN DE DIRECCIONES
      const customerCity = billingAddress.city || shippingAddress.city || '';
      const customerState = billingAddress.state || shippingAddress.state || '';
      const customerAddress = billingAddress.address || billingAddress.address_1 || '';
      const customerCountry = billingAddress.country || shippingAddress.country || '';
      
      // ✅ INFORMACIÓN DE FECHAS FORMATEADA
      const createdDate = order.created_at || order.date_created;
      const paidDate = order.date_paid;
      const completedDate = order.date_completed;
      
      return {
        // BÁSICO
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        
        // CLIENTE COMPLETO
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_city: customerCity,
        customer_state: customerState,
        customer_address: customerAddress,
        customer_country: customerCountry,
        customer_ip_address: order.customer_ip_address,
        
        // FINANCIERO
        total_amount: parseFloat(order.total_amount || 0),
        subtotal: parseFloat(order.subtotal || 0),
        tax_amount: parseFloat(order.tax_amount || 0),
        shipping_amount: parseFloat(order.shipping_amount || 0),
        discount_amount: parseFloat(order.discount_amount || 0),
        currency: order.currency || 'COP',
        
        // PAGO
        payment_method: order.payment_method,
        payment_reference: order.payment_reference,
        epayco_transaction_id: order.epayco_transaction_id,
        
        // PRODUCTOS
        total_items: parseInt(order.total_items || 0),
        total_quantity: parseInt(order.total_quantity || 0),
        
        // FECHAS
        created_at: createdDate,
        date_paid: paidDate,
        date_completed: completedDate,
        updated_at: order.updated_at,
        
        // SISTEMA
        user_id: order.user_id,
        woocommerce_id: order.woocommerce_id,
        created_via: order.created_via,
        
        // NOTAS
        notes: order.notes,
        admin_notes: order.admin_notes,
        
        // FLAGS ÚTILES
        is_guest_order: !order.user_id,
        has_shipping: parseFloat(order.shipping_amount || 0) > 0,
        has_tax: parseFloat(order.tax_amount || 0) > 0,
        has_discount: parseFloat(order.discount_amount || 0) > 0,
        is_paid: order.payment_status === 'completed',
        is_completed: order.status === 'delivered',
        from_woocommerce: !!order.woocommerce_id,
        has_complete_address: !!(customerAddress && customerCity),
        
        // ESTADO LEGIBLE
        status_label: getStatusLabel(order.status),
        payment_status_label: getPaymentStatusLabel(order.payment_status),
        
        // TOTALES FORMATEADOS
        formatted_total: formatCurrency(order.total_amount),
        formatted_subtotal: formatCurrency(order.subtotal)
      };
    });

    // Calcular paginación
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: processedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      // ✅ ESTADÍSTICAS ADICIONALES
      summary: {
        total_orders: total,
        orders_by_status: {
          pending: processedOrders.filter(o => o.status === 'pending').length,
          processing: processedOrders.filter(o => o.status === 'processing').length,
          shipped: processedOrders.filter(o => o.status === 'shipped').length,
          delivered: processedOrders.filter(o => o.status === 'delivered').length,
          cancelled: processedOrders.filter(o => o.status === 'cancelled').length
        },
        orders_by_payment: {
          pending: processedOrders.filter(o => o.payment_status === 'pending').length,
          completed: processedOrders.filter(o => o.payment_status === 'completed').length,
          failed: processedOrders.filter(o => o.payment_status === 'failed').length,
          refunded: processedOrders.filter(o => o.payment_status === 'refunded').length
        },
        total_revenue: processedOrders.reduce((sum, o) => sum + o.total_amount, 0),
        orders_with_complete_info: processedOrders.filter(o => o.has_complete_address).length
      }
    });
	  
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ✅ FUNCIONES UTILITARIAS
function getStatusLabel(status) {
  const labels = {
    pending: 'Pendiente',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };
  return labels[status] || status;
}

function getPaymentStatusLabel(status) {
  const labels = {
    pending: 'Pago Pendiente',
    completed: 'Pago Completado',
    failed: 'Pago Fallido',
    refunded: 'Reembolsado'
  };
  return labels[status] || status;
}

function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

export default adminAuth(handler);