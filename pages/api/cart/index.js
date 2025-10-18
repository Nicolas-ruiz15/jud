// pages/api/cart/index.js - VERSIÓN INTEGRADA con autenticación
import { query } from '../../../lib/database';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const SESSION_COOKIE_NAME = 'judaica_session_id';

// Helper para obtener usuario autenticado
const getAuthenticatedUser = async (req) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe
    const userResult = await query(
      'SELECT id, name, email FROM users WHERE id = ? AND role = ?',
      [decoded.userId, 'customer']
    );

    return userResult.length > 0 ? userResult[0] : null;
  } catch (error) {
    return null;
  }
};

// Helper para obtener o crear session ID
const getSessionId = (req, res) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...v] = c.trim().split('=');
      return [key, decodeURIComponent(v.join('='))];
    })
  );

  let sessionId = cookies[SESSION_COOKIE_NAME];

  if (!sessionId) {
    sessionId = uuidv4();
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };

    const cookieString = `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; Max-Age=${cookieOptions.maxAge}; SameSite=${cookieOptions.sameSite}${cookieOptions.secure ? '; Secure' : ''}`;
    
    res.setHeader('Set-Cookie', cookieString);
  }
  
  return sessionId;
};

// Migrar carrito de sesión a usuario (cuando se autentica)
const migrateSessionCartToUser = async (sessionId, userId) => {
  try {
    console.log('Migrando carrito de sesión a usuario:', { sessionId, userId });
    
    // Obtener items del carrito de sesión
    const sessionItems = await query(`
      SELECT * FROM cart_items WHERE session_id = ?
    `, [sessionId]);

    if (sessionItems.length === 0) {
      return;
    }

    // Verificar si el usuario ya tiene items en su carrito
    const userItems = await query(`
      SELECT * FROM cart_items WHERE user_id = ?
    `, [userId]);

    // Si el usuario ya tiene carrito, consolidar
    for (const sessionItem of sessionItems) {
      const existingUserItem = userItems.find(ui => ui.product_id === sessionItem.product_id);
      
      if (existingUserItem) {
        // Actualizar cantidad en item existente del usuario
        await query(`
          UPDATE cart_items 
          SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [sessionItem.quantity, existingUserItem.id]);
      } else {
        // Transferir item de sesión a usuario
        await query(`
          UPDATE cart_items 
          SET user_id = ?, session_id = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [userId, sessionItem.id]);
      }
    }

    // Limpiar items restantes de la sesión
    await query(`
      DELETE FROM cart_items WHERE session_id = ?
    `, [sessionId]);

    console.log('Migración de carrito completada');
  } catch (error) {
    console.error('Error migrando carrito:', error);
  }
};

export default async function handler(req, res) {
  // CORS headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://tu-dominio.com',
    'https://www.tu-dominio.com'
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const sessionId = getSessionId(req, res);
    const authenticatedUser = await getAuthenticatedUser(req);
    
    console.log('Cart API - Session:', sessionId, 'User:', authenticatedUser?.email || 'No autenticado');

    // Si hay usuario autenticado, migrar carrito de sesión
    if (authenticatedUser && sessionId) {
      await migrateSessionCartToUser(sessionId, authenticatedUser.id);
    }

    switch (req.method) {
      case 'GET':
        return await getCart(req, res, sessionId, authenticatedUser);
      case 'POST':
        return await addToCart(req, res, sessionId, authenticatedUser);
      case 'PUT':
        return await updateCartItem(req, res, sessionId, authenticatedUser);
      case 'DELETE':
        return await deleteCartItem(req, res, sessionId, authenticatedUser);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ 
          success: false, 
          message: `Método ${req.method} no permitido` 
        });
    }
  } catch (error) {
    console.error('Cart API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET - Obtener carrito
async function getCart(req, res, sessionId, authenticatedUser) {
  try {
    console.log('Getting cart...');

    let whereClause = '';
    let params = [];

    if (authenticatedUser) {
      // Buscar por user_id si está autenticado
      whereClause = 'WHERE ci.user_id = ?';
      params.push(authenticatedUser.id);
    } else if (sessionId) {
      // Buscar por session_id si no está autenticado
      whereClause = 'WHERE ci.session_id = ?';
      params.push(sessionId);
    } else {
      // Sin sesión ni usuario
      return res.status(200).json({ 
        success: true, 
        data: [],
        sessionId: sessionId
      });
    }

    const cartItems = await query(`
      SELECT 
        ci.id,
        ci.product_id,
        ci.quantity,
        ci.created_at,
        p.name,
        p.slug,
        p.price,
        p.sale_price,
        p.stock_quantity,
        p.manage_stock,
        p.stock_status,
        p.status as product_status,
        COALESCE(pi.image_url, '') as image_url,
        COALESCE(pi.alt_text, p.name) as alt_text
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = 1
      ${whereClause} AND p.status = 'active'
      ORDER BY ci.created_at DESC
    `, params);

    console.log('Cart items found:', cartItems.length);

    return res.status(200).json({ 
      success: true, 
      data: cartItems,
      sessionId: sessionId,
      userId: authenticatedUser?.id || null
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    throw error;
  }
}

// POST - Agregar al carrito
async function addToCart(req, res, sessionId, authenticatedUser) {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity || quantity <= 0 || isNaN(quantity)) {
    return res.status(400).json({ 
      success: false, 
      message: 'product_id y quantity válidos son requeridos' 
    });
  }

  try {
    console.log('Adding to cart:', { product_id, quantity, sessionId, userId: authenticatedUser?.id });

    // Verificar que el producto existe y está activo
    const product = await query(`
      SELECT id, name, price, sale_price, stock_quantity, manage_stock, stock_status, status
      FROM products 
      WHERE id = ? AND status = 'active'
    `, [product_id]);

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o inactivo'
      });
    }

    const productData = product[0];

    // Validación de stock
    if (productData.manage_stock) {
      if (productData.stock_status !== 'in_stock') {
        return res.status(400).json({
          success: false,
          message: 'Producto fuera de stock'
        });
      }
      
      if (productData.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Disponible: ${productData.stock_quantity}`
        });
      }
    }

    // Buscar item existente
    let whereClause = '';
    let params = [];

    if (authenticatedUser) {
      whereClause = 'WHERE user_id = ? AND product_id = ?';
      params = [authenticatedUser.id, product_id];
    } else {
      whereClause = 'WHERE session_id = ? AND product_id = ?';
      params = [sessionId, product_id];
    }

    const existingItem = await query(`
      SELECT id, quantity 
      FROM cart_items 
      ${whereClause}
    `, params);

    if (existingItem.length > 0) {
      // Actualizar cantidad existente
      const newQuantity = existingItem[0].quantity + parseInt(quantity);
      
      // Verificar stock para la nueva cantidad total
      if (productData.manage_stock && productData.stock_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Disponible: ${productData.stock_quantity}, en carrito: ${existingItem[0].quantity}`
        });
      }
      
      await query(`
        UPDATE cart_items 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [newQuantity, existingItem[0].id]);
    } else {
      // Insertar nuevo item
      const insertData = {
        product_id: parseInt(product_id),
        quantity: parseInt(quantity)
      };

      if (authenticatedUser) {
        insertData.user_id = authenticatedUser.id;
      } else {
        insertData.session_id = sessionId;
      }

      await query(`
        INSERT INTO cart_items (
          ${authenticatedUser ? 'user_id' : 'session_id'}, 
          product_id, 
          quantity, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        authenticatedUser ? authenticatedUser.id : sessionId,
        parseInt(product_id),
        parseInt(quantity)
      ]);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Producto agregado al carrito',
      sessionId: sessionId,
      userId: authenticatedUser?.id || null
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

// PUT - Actualizar cantidad
async function updateCartItem(req, res, sessionId, authenticatedUser) {
  const { item_id, quantity } = req.body;

  if (!item_id || quantity === undefined || quantity < 0 || isNaN(quantity)) {
    return res.status(400).json({ 
      success: false, 
      message: 'item_id y quantity válidos son requeridos' 
    });
  }

  try {
    // Verificar que el item pertenece al usuario/sesión
    let whereClause = '';
    let params = [item_id];

    if (authenticatedUser) {
      whereClause = 'AND ci.user_id = ?';
      params.push(authenticatedUser.id);
    } else {
      whereClause = 'AND ci.session_id = ?';
      params.push(sessionId);
    }

    const existingItem = await query(`
      SELECT ci.id, ci.product_id, ci.quantity, p.stock_quantity, p.manage_stock
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ? ${whereClause}
    `, params);

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en tu carrito'
      });
    }

    if (quantity === 0) {
      // Eliminar si quantity es 0
      await query(`
        DELETE FROM cart_items 
        WHERE id = ? ${whereClause}
      `, params);
    } else {
      // Verificar stock antes de actualizar
      const itemData = existingItem[0];
      if (itemData.manage_stock && itemData.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Disponible: ${itemData.stock_quantity}`
        });
      }

      // Actualizar cantidad
      await query(`
        UPDATE cart_items 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? ${whereClause}
      `, [parseInt(quantity), ...params]);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Carrito actualizado' 
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
}

// DELETE - Eliminar item
async function deleteCartItem(req, res, sessionId, authenticatedUser) {
  const { item_id } = req.body;
  
  if (!item_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'item_id es requerido' 
    });
  }
  
  try {
    let whereClause = '';
    let params = [item_id];

    if (authenticatedUser) {
      whereClause = 'AND user_id = ?';
      params.push(authenticatedUser.id);
    } else {
      whereClause = 'AND session_id = ?';
      params.push(sessionId);
    }

    const result = await query(`
      DELETE FROM cart_items 
      WHERE id = ? ${whereClause}
    `, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en tu carrito'
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Producto eliminado del carrito' 
    });
  } catch (error) {
    console.error('Error deleting from cart:', error);
    throw error;
  }
}