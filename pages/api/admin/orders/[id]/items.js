// /pages/api/admin/orders/[id]/items.js
// API para gestionar items de una orden (agregar, quitar, modificar)
import { query, transaction } from '../../../../../lib/database';
import { adminAuth } from '../../../../../middleware/adminAuth';

/**
 * Recalcular totales de la orden
 */
async function recalculateOrderTotals(orderId, conn) {
  // Obtener todos los items de la orden
  const items = await conn.query(`
    SELECT quantity, price, total, tax_amount 
    FROM order_items 
    WHERE order_id = ?
  `, [orderId]);

  // Calcular totales
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
  const taxAmount = items.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0);
  
  // Obtener datos actuales de la orden para mantener shipping y discount
  const currentOrder = await conn.queryOne(`
    SELECT shipping_amount, discount_amount 
    FROM orders 
    WHERE id = ?
  `, [orderId]);

  const shippingAmount = parseFloat(currentOrder?.shipping_amount || 0);
  const discountAmount = parseFloat(currentOrder?.discount_amount || 0);
  const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

  // Actualizar la orden
  await conn.query(`
    UPDATE orders 
    SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = NOW()
    WHERE id = ?
  `, [subtotal, taxAmount, totalAmount, orderId]);

  return {
    subtotal,
    tax_amount: taxAmount,
    shipping_amount: shippingAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount
  };
}

/**
 * Agregar nuevo item a la orden
 */
async function addItem(req, res, orderId) {
  const { product_id, product_name, product_sku, quantity, price } = req.body;

  // Validaciones
  if (!product_id || !product_name || !quantity || !price) {
    return res.status(400).json({
      success: false,
      message: 'Campos requeridos: product_id, product_name, quantity, price'
    });
  }

  if (quantity <= 0 || price < 0) {
    return res.status(400).json({
      success: false,
      message: 'Cantidad debe ser mayor a 0 y precio no puede ser negativo'
    });
  }

  try {
    const result = await transaction(async (conn) => {
      // Verificar que la orden existe
      const order = await conn.queryOne('SELECT id FROM orders WHERE id = ?', [orderId]);
      if (!order) {
        throw new Error('Orden no encontrada');
      }

      // Verificar si el producto ya existe en la orden
      const existingItem = await conn.queryOne(`
        SELECT id, quantity, price 
        FROM order_items 
        WHERE order_id = ? AND product_id = ?
      `, [orderId, product_id]);

      let itemResult;
      const total = quantity * price;

      if (existingItem) {
        // Si existe, actualizar cantidad y total
        const newQuantity = existingItem.quantity + quantity;
        const newTotal = newQuantity * price;

        await conn.query(`
          UPDATE order_items 
          SET quantity = ?, total = ?, created_at = NOW()
          WHERE id = ?
        `, [newQuantity, newTotal, existingItem.id]);

        itemResult = {
          id: existingItem.id,
          product_id,
          product_name,
          product_sku: product_sku || null,
          quantity: newQuantity,
          price,
          total: newTotal,
          action: 'updated'
        };
      } else {
        // Si no existe, crear nuevo item
        const insertResult = await conn.query(`
          INSERT INTO order_items (
            order_id, product_id, product_name, product_sku, 
            quantity, price, total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [orderId, product_id, product_name, product_sku || null, quantity, price, total]);

        itemResult = {
          id: insertResult.insertId,
          product_id,
          product_name,
          product_sku: product_sku || null,
          quantity,
          price,
          total,
          action: 'added'
        };
      }

      // Recalcular totales de la orden
      const orderTotals = await recalculateOrderTotals(orderId, conn);

      return { item: itemResult, orderTotals };
    });

    // Registrar en log de emails si es necesario
    try {
      await query(`
        INSERT INTO order_email_log (order_id, email_type, recipient, subject, sent_at, status, admin_user)
        VALUES (?, 'admin_action', 'admin', ?, NOW(), 'sent', ?)
      `, [
        orderId,
        `Item ${result.item.action}: ${result.item.product_name}`,
        req.user?.email || 'admin'
      ]);
    } catch (logError) {
      console.warn('Error registrando log:', logError.message);
    }

    res.status(200).json({
      success: true,
      message: `Producto ${result.item.action === 'added' ? 'agregado' : 'actualizado'} exitosamente`,
      data: result
    });

  } catch (error) {
    console.error('Error agregando item:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
}

/**
 * Actualizar item existente
 */
async function updateItem(req, res, orderId) {
  const { item_id, quantity, price } = req.body;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      message: 'item_id es requerido'
    });
  }

  if (quantity !== undefined && quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Cantidad debe ser mayor a 0'
    });
  }

  if (price !== undefined && price < 0) {
    return res.status(400).json({
      success: false,
      message: 'Precio no puede ser negativo'
    });
  }

  try {
    const result = await transaction(async (conn) => {
      // Verificar que el item existe y pertenece a la orden
      const item = await conn.queryOne(`
        SELECT * FROM order_items 
        WHERE id = ? AND order_id = ?
      `, [item_id, orderId]);

      if (!item) {
        throw new Error('Item no encontrado en esta orden');
      }

      // Preparar campos a actualizar
      const updates = [];
      const params = [];

      if (quantity !== undefined) {
        updates.push('quantity = ?');
        params.push(quantity);
      }

      if (price !== undefined) {
        updates.push('price = ?');
        params.push(price);
      }

      // Calcular nuevo total
      const newQuantity = quantity !== undefined ? quantity : item.quantity;
      const newPrice = price !== undefined ? price : item.price;
      const newTotal = newQuantity * newPrice;

      updates.push('total = ?');
      params.push(newTotal);

      if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      // Actualizar el item
      params.push(item_id);
      await conn.query(`
        UPDATE order_items 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `, params);

      // Recalcular totales de la orden
      const orderTotals = await recalculateOrderTotals(orderId, conn);

      return {
        item: {
          id: item_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: newQuantity,
          price: newPrice,
          total: newTotal
        },
        orderTotals
      };
    });

    res.status(200).json({
      success: true,
      message: 'Item actualizado exitosamente',
      data: result
    });

  } catch (error) {
    console.error('Error actualizando item:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
}

/**
 * Eliminar item de la orden
 */
async function deleteItem(req, res, orderId) {
  const { item_id } = req.query;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      message: 'item_id es requerido'
    });
  }

  try {
    const result = await transaction(async (conn) => {
      // Verificar que el item existe y pertenece a la orden
      const item = await conn.queryOne(`
        SELECT * FROM order_items 
        WHERE id = ? AND order_id = ?
      `, [item_id, orderId]);

      if (!item) {
        throw new Error('Item no encontrado en esta orden');
      }

      // Eliminar el item
      await conn.query('DELETE FROM order_items WHERE id = ?', [item_id]);

      // Recalcular totales de la orden
      const orderTotals = await recalculateOrderTotals(orderId, conn);

      return {
        deletedItem: item,
        orderTotals
      };
    });

    res.status(200).json({
      success: true,
      message: 'Item eliminado exitosamente',
      data: result
    });

  } catch (error) {
    console.error('Error eliminando item:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
}

/**
 * Obtener items de la orden
 */
async function getItems(req, res, orderId) {
  try {
    const items = await query(`
      SELECT * FROM order_items 
      WHERE order_id = ? 
      ORDER BY created_at DESC
    `, [orderId]);

    res.status(200).json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Error obteniendo items:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Handler principal
 */
async function handler(req, res) {
  const { id: orderId } = req.query;

  if (!orderId || orderId === 'favicon.ico') {
    return res.status(400).json({
      success: false,
      message: 'ID de orden requerido'
    });
  }

  switch (req.method) {
    case 'GET':
      return await getItems(req, res, orderId);
    
    case 'POST':
      return await addItem(req, res, orderId);
    
    case 'PUT':
      return await updateItem(req, res, orderId);
    
    case 'DELETE':
      return await deleteItem(req, res, orderId);
      
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        message: `Método ${req.method} no permitido`
      });
  }
}

export default adminAuth(handler);