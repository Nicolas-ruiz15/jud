// pages/api/user/orders/[orderId]/reorder.js - Reordenar productos de un pedido
import { query } from '../../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

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
    const { orderId } = req.query;

    // Verificar que el pedido existe y pertenece al usuario
    const orderResult = await query(
      'SELECT id, status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const order = orderResult[0];

    // Obtener los productos del pedido original
    const orderItems = await query(
      `SELECT 
        oi.product_id,
        oi.quantity,
        p.name,
        p.price as current_price,
        p.stock,
        p.active
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [orderId]
    );

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se encontraron productos en este pedido'
      });
    }

    // Verificar disponibilidad de productos
    const availableItems = [];
    const unavailableItems = [];

    for (const item of orderItems) {
      if (!item.active) {
        unavailableItems.push({
          name: item.name,
          reason: 'Producto no disponible'
        });
      } else if (item.stock < item.quantity) {
        unavailableItems.push({
          name: item.name,
          reason: `Stock insuficiente (disponible: ${item.stock}, solicitado: ${item.quantity})`
        });
      } else {
        availableItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          name: item.name,
          current_price: parseFloat(item.current_price)
        });
      }
    }

    // Si no hay productos disponibles
    if (availableItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ningún producto del pedido está disponible actualmente',
        unavailableItems: unavailableItems
      });
    }

    // Agregar productos disponibles al carrito
    // Primero, verificar si ya existe un carrito activo para el usuario
    let cartResult = await query(
      'SELECT id FROM cart_items WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const addedItems = [];

    for (const item of availableItems) {
      // Verificar si el producto ya está en el carrito
      const existingCartItem = await query(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
        [userId, item.product_id]
      );

      if (existingCartItem.length > 0) {
        // Actualizar cantidad existente
        const newQuantity = existingCartItem[0].quantity + item.quantity;
        await query(
          'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
          [newQuantity, existingCartItem[0].id]
        );
        
        addedItems.push({
          ...item,
          action: 'updated',
          newQuantity: newQuantity
        });
      } else {
        // Agregar nuevo item al carrito
        await query(
          `INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [userId, item.product_id, item.quantity]
        );
        
        addedItems.push({
          ...item,
          action: 'added'
        });
      }
    }

    // Preparar respuesta
    const response = {
      success: true,
      message: `${addedItems.length} producto${addedItems.length !== 1 ? 's' : ''} agregado${addedItems.length !== 1 ? 's' : ''} al carrito`,
      data: {
        addedItems: addedItems,
        addedCount: addedItems.length,
        totalItemsInOriginalOrder: orderItems.length
      }
    };

    // Incluir información sobre productos no disponibles si los hay
    if (unavailableItems.length > 0) {
      response.message += `. ${unavailableItems.length} producto${unavailableItems.length !== 1 ? 's' : ''} no pudo${unavailableItems.length !== 1 ? 'n' : ''} ser agregado${unavailableItems.length !== 1 ? 's' : ''}.`;
      response.data.unavailableItems = unavailableItems;
      response.data.unavailableCount = unavailableItems.length;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error reordenando:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}