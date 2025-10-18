// pages/api/user/payment-methods/[methodId].js - CRUD individual de métodos de pago
import { query } from '../../../../lib/database';

export default async function handler(req, res) {
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
    const { methodId } = req.query;

    // Verificar que el método de pago pertenece al usuario
    const methodResult = await query(
      'SELECT * FROM user_payment_methods WHERE id = ? AND user_id = ?',
      [methodId, userId]
    );

    if (methodResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    const existingMethod = methodResult[0];

    if (req.method === 'PUT') {
      // Actualizar método de pago (solo campos no sensibles)
      const { nickname, cardName, expiryMonth, expiryYear, accountName, isDefault } = req.body;

      // Validaciones
      const errors = {};
      if (!nickname?.trim()) errors.nickname = 'El nombre es requerido';

      if (existingMethod.type === 'card') {
        if (!cardName?.trim()) errors.cardName = 'El nombre en la tarjeta es requerido';
        
        // Validar fecha de vencimiento si se proporcionan
        if (expiryMonth && expiryYear) {
          const now = new Date();
          const expiry = new Date(expiryYear, expiryMonth - 1);
          if (expiry <= now) {
            errors.expiryMonth = 'La tarjeta está vencida';
          }
        }
      } else if (existingMethod.type === 'bank_account') {
        if (!accountName?.trim()) errors.accountName = 'El nombre de la cuenta es requerido';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Datos no válidos',
          errors
        });
      }

      // Si se marca como predeterminado, actualizar otros
      if (isDefault && !existingMethod.is_default) {
        await query(
          'UPDATE user_payment_methods SET is_default = 0 WHERE user_id = ? AND id != ?',
          [userId, methodId]
        );
      }

      // Construir campos a actualizar dinámicamente
      let updateFields = ['nickname = ?', 'is_default = ?', 'updated_at = NOW()'];
      let updateValues = [nickname.trim(), isDefault ? 1 : 0];

      if (existingMethod.type === 'card') {
        if (cardName) {
          updateFields.push('card_name = ?');
          updateValues.push(cardName.trim());
        }
        if (expiryMonth) {
          updateFields.push('expiry_month = ?');
          updateValues.push(expiryMonth);
        }
        if (expiryYear) {
          updateFields.push('expiry_year = ?');
          updateValues.push(expiryYear);
        }
      } else if (existingMethod.type === 'bank_account') {
        if (accountName) {
          updateFields.push('account_name = ?');
          updateValues.push(accountName.trim());
        }
      }

      // Agregar condiciones WHERE
      updateValues.push(methodId, userId);

      await query(
        `UPDATE user_payment_methods SET ${updateFields.join(', ')} 
         WHERE id = ? AND user_id = ?`,
        updateValues
      );

      res.status(200).json({
        success: true,
        message: 'Método de pago actualizado correctamente'
      });

    } else if (req.method === 'DELETE') {
      // No permitir eliminar si es el único método predeterminado
      if (existingMethod.is_default) {
        const otherMethodsCount = await query(
          'SELECT COUNT(*) as count FROM user_payment_methods WHERE user_id = ? AND id != ?',
          [userId, methodId]
        );

        if (otherMethodsCount[0].count > 0) {
          // Si hay otros métodos, establecer el primero como predeterminado
          await query(
            `UPDATE user_payment_methods SET is_default = 1 
             WHERE user_id = ? AND id != ? 
             ORDER BY created_at ASC LIMIT 1`,
            [userId, methodId]
          );
        }
      }

      // Eliminar el método de pago
      await query(
        'DELETE FROM user_payment_methods WHERE id = ? AND user_id = ?',
        [methodId, userId]
      );

      res.status(200).json({
        success: true,
        message: 'Método de pago eliminado correctamente'
      });

    } else {
      res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

  } catch (error) {
    console.error('Error en API individual de método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}