// /pages/api/admin/orders/[id].js - VERSIÓN ULTRA SIMPLIFICADA
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

/**
 * Parsea JSON de forma segura
 */
const safeJsonParse = (jsonString, defaultValue = null) => {
  if (!jsonString || typeof jsonString !== 'string') {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON Parse Error:", e.message);
    return defaultValue;
  }
};

/**
 * GET ULTRA SIMPLE - Solo campos que definitivamente existen
 */
async function getOrder(req, res, orderId) {
  try {
    console.log(`Obteniendo orden ultra simple ID: ${orderId}`);

    // ✅ CONSULTA SÚPER BÁSICA - Solo usar SELECT *
    const orderResult = await query(`SELECT * FROM \`orders\` WHERE id = ?`, [orderId]);
    
    if (orderResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Orden no encontrada' 
      });
    }

    const order = orderResult[0];
    console.log(`Orden encontrada: ${order.order_number}`);

    // ✅ OBTENER PRODUCTOS - Solo order_items
    const items = await query(`SELECT * FROM \`order_items\` WHERE order_id = ? ORDER BY id`, [orderId]);
    console.log(`Items encontrados: ${items.length}`);

    // ✅ PROCESAR JSON DE FORMA ULTRA SEGURA
    const billingAddress = safeJsonParse(order.billing_address, {});
    const shippingAddress = safeJsonParse(order.shipping_address, {});

    // ✅ CONSTRUIR INFORMACIÓN DEL CLIENTE - ULTRA ROBUSTA
    const firstName = order.customer_first_name || billingAddress.first_name || '';
    const lastName = order.customer_last_name || billingAddress.last_name || '';
    const customerName = `${firstName} ${lastName}`.trim() || 'Cliente invitado';
    const customerEmail = order.customer_email || billingAddress.email || 'No disponible';
    const customerPhone = order.customer_phone || billingAddress.phone || '';

    // ✅ PROCESAR LÍNEAS ADICIONALES
    const shippingLines = safeJsonParse(order.shipping_lines, []);
    const couponLines = safeJsonParse(order.coupon_lines, []);
    const taxLines = safeJsonParse(order.tax_lines, []);
    const orderMetaData = safeJsonParse(order.order_meta_data, []);

    // ✅ RESPUESTA COMPLETA CON TODA LA INFORMACIÓN
    const finalOrder = {
      // ===== BÁSICO =====
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      
      // ===== CLIENTE COMPLETO =====
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_ip_address: order.customer_ip_address,
      customer_user_agent: order.customer_user_agent,
      
      // ===== FINANCIERO COMPLETO =====
      total_amount: parseFloat(order.total_amount || 0),
      subtotal: parseFloat(order.subtotal || 0),
      tax_amount: parseFloat(order.tax_amount || 0),
      shipping_amount: parseFloat(order.shipping_amount || 0),
      discount_amount: parseFloat(order.discount_amount || 0),
      currency: order.currency || 'COP',
      prices_include_tax: !!order.prices_include_tax,
      
      // ===== PAGO COMPLETO =====
      payment_method: order.payment_method,
      payment_reference: order.payment_reference,
      epayco_transaction_id: order.epayco_transaction_id,
      
      // ===== PRODUCTOS CON MÁS INFO =====
      items: items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.total),
        tax_amount: parseFloat(item.tax_amount || 0),
        meta_data: safeJsonParse(item.meta_data, [])
      })),
      
      // ===== DIRECCIONES COMPLETAS =====
      billing_address: {
        first_name: billingAddress.first_name || firstName,
        last_name: billingAddress.last_name || lastName,
        email: billingAddress.email || customerEmail,
        phone: billingAddress.phone || customerPhone,
        address: billingAddress.address || billingAddress.address_1 || '',
        address_2: billingAddress.address_2 || '',
        city: billingAddress.city || '',
        state: billingAddress.state || '',
        postcode: billingAddress.postcode || '',
        country: billingAddress.country || '',
        company: billingAddress.company || ''
      },
      shipping_address: {
        first_name: shippingAddress.first_name || billingAddress.first_name || firstName,
        last_name: shippingAddress.last_name || billingAddress.last_name || lastName,
        address: shippingAddress.address || shippingAddress.address_1 || billingAddress.address || billingAddress.address_1 || '',
        address_2: shippingAddress.address_2 || billingAddress.address_2 || '',
        city: shippingAddress.city || billingAddress.city || '',
        state: shippingAddress.state || billingAddress.state || '',
        postcode: shippingAddress.postcode || billingAddress.postcode || '',
        country: shippingAddress.country || billingAddress.country || '',
        company: shippingAddress.company || billingAddress.company || ''
      },
      
      // ===== LÍNEAS ADICIONALES =====
      shipping_lines: shippingLines,
      coupon_lines: couponLines,
      tax_lines: taxLines,
      order_meta_data: orderMetaData,
      
      // ===== FECHAS COMPLETAS =====
      created_at: order.created_at,
      updated_at: order.updated_at,
      date_created: order.date_created,
      date_modified: order.date_modified,
      date_paid: order.date_paid,
      date_completed: order.date_completed,
      
      // ===== INFORMACIÓN DEL SISTEMA =====
      woocommerce_id: order.woocommerce_id,
      created_via: order.created_via,
      woo_version: order.woo_version,
      cart_hash: order.cart_hash,
      session_id: order.session_id,
      selected_address_id: order.selected_address_id,
      selected_payment_id: order.selected_payment_id,
      user_id: order.user_id,
      
      // ===== NOTAS =====
      notes: order.notes,
      admin_notes: order.admin_notes,
      
      // ===== FLAGS ÚTILES =====
      flags: {
        is_guest_order: !order.user_id,
        has_shipping: parseFloat(order.shipping_amount || 0) > 0,
        has_tax: parseFloat(order.tax_amount || 0) > 0,
        has_discount: parseFloat(order.discount_amount || 0) > 0,
        has_coupons: couponLines.length > 0,
        is_paid: order.payment_status === 'completed',
        is_completed: order.status === 'delivered',
        from_woocommerce: !!order.woocommerce_id,
        has_complete_billing: !!(billingAddress.address && billingAddress.city),
        has_complete_shipping: !!(shippingAddress.address && shippingAddress.city)
      },
      
      // ===== TIMELINE MEJORADO =====
      timeline: generateEnhancedTimeline(order)
    };
    
    console.log('Respuesta construida exitosamente');
    
    res.status(200).json({
      success: true,
      data: finalOrder
    });

  } catch (error) {
    console.error(`Error en GET /orders/${orderId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * ✅ TIMELINE MEJORADO CON TODAS LAS FECHAS
 */
function generateEnhancedTimeline(order) {
  const timeline = [];
  
  // Orden creada
  if (order.created_at || order.date_created) {
    timeline.push({
      icon: '🛒',
      title: 'Orden Creada',
      description: `Orden #${order.order_number} generada${order.created_via ? ` vía ${order.created_via}` : ''}${order.woocommerce_id ? ` (WooCommerce #${order.woocommerce_id})` : ''}`,
      time: order.date_created || order.created_at,
      status: 'completed'
    });
  }
  
  // Pago procesado
  if (order.date_paid) {
    timeline.push({
      icon: '💳',
      title: 'Pago Completado',
      description: `Pago procesado vía ${order.payment_method || 'sistema de pago'}${order.payment_reference ? ` (Ref: ${order.payment_reference})` : ''}${order.epayco_transaction_id ? ` (ePayco: ${order.epayco_transaction_id})` : ''}`,
      time: order.date_paid,
      status: 'completed'
    });
  }
  
  // Estado actual detallado
  const statusConfig = {
    pending: { icon: '⏳', title: 'Orden Pendiente', desc: 'Esperando confirmación de pago' },
    processing: { icon: '⚙️', title: 'Procesando Orden', desc: 'Preparando productos para envío' },
    shipped: { icon: '🚚', title: 'Orden Enviada', desc: 'Productos en camino al destino' },
    delivered: { icon: '✅', title: 'Orden Entregada', desc: 'Entrega completada exitosamente' },
    cancelled: { icon: '❌', title: 'Orden Cancelada', desc: 'Orden cancelada por el sistema' }
  };
  
  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  timeline.push({
    icon: currentStatus.icon,
    title: currentStatus.title,
    description: currentStatus.desc,
    time: order.updated_at || order.created_at,
    status: order.status === 'delivered' ? 'completed' : 'current'
  });
  
  // Orden completada
  if (order.date_completed) {
    timeline.push({
      icon: '🎉',
      title: 'Proceso Completado',
      description: 'Orden finalizada exitosamente',
      time: order.date_completed,
      status: 'completed'
    });
  }
  
  return timeline.sort((a, b) => new Date(a.time) - new Date(b.time));
}

/**
 * UPDATE ULTRA SIMPLE
 */
async function updateOrder(req, res, orderId) {
  try {
    const { status, payment_status, admin_notes } = req.body;
    const updateFields = [];
    const params = [];

    if (status !== undefined) {
      updateFields.push('`status` = ?');
      params.push(status);
    }
    
    if (payment_status !== undefined) {
      updateFields.push('`payment_status` = ?');
      params.push(payment_status);
    }
    
    if (admin_notes !== undefined) {
      updateFields.push('`admin_notes` = ?');
      params.push(admin_notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay campos para actualizar.' 
      });
    }
    
    updateFields.push('`updated_at` = NOW()');
    params.push(orderId);

    await query(
      `UPDATE \`orders\` SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.status(200).json({ 
      success: true, 
      message: 'Orden actualizada exitosamente'
    });

  } catch (error) {
    console.error(`Error en PUT /orders/${orderId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error actualizando la orden.'
    });
  }
}

/**
 * HANDLER PRINCIPAL
 */
async function handler(req, res) {
  const { id } = req.query;

  if (!id || id === 'favicon.ico') {
    return res.status(204).send();
  }

  switch (req.method) {
    case 'GET':
      return await getOrder(req, res, id);
    
    case 'PUT':
      return await updateOrder(req, res, id);
      
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ 
        success: false, 
        message: `Método ${req.method} no permitido` 
      });
  }
}

export default adminAuth(handler);