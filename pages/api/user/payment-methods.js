// pages/api/user/payment-methods.js - CRUD de métodos de pago del usuario
import { query } from '../../../lib/database';
import crypto from 'crypto';

// Función para encriptar datos sensibles
function encryptSensitiveData(data) {
  const algorithm = 'aes-256-gcm';
  const secretKey = process.env.ENCRYPTION_SECRET || 'your-32-char-secret-key-here!!!'; // En producción, usar variable de entorno
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, secretKey);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex')
  };
}

// Función para obtener últimos 4 dígitos
function getLastFour(number) {
  return number.toString().slice(-4);
}

// Función para detectar tipo de tarjeta
function detectCardType(cardNumber) {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (cleanNumber.startsWith('4')) return 'visa';
  if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
  if (cleanNumber.startsWith('3')) return 'amex';
  
  return 'unknown';
}

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

    if (req.method === 'GET') {
      // Obtener métodos de pago del usuario (sin datos sensibles)
      const paymentMethods = await query(
        `SELECT 
          id, type, nickname, last_four as lastFour, card_type as cardType,
          card_name as cardName, expiry_month as expiryMonth, expiry_year as expiryYear,
          bank_name as bankName, account_type as accountType, account_name as accountName,
          is_default as isDefault, created_at, updated_at
        FROM user_payment_methods 
        WHERE user_id = ? 
        ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );

      // Convertir is_default de tinyint a boolean
      const formattedMethods = paymentMethods.map(method => ({
        ...method,
        isDefault: Boolean(method.isDefault)
      }));

      res.status(200).json({
        success: true,
        data: formattedMethods
      });

    } else if (req.method === 'POST') {
      // Crear nuevo método de pago
      const {
        type, nickname, cardNumber, cardName, expiryMonth, expiryYear,
        bankName, accountType, accountNumber, accountName, isDefault
      } = req.body;

      // Validaciones
      const errors = {};
      if (!nickname?.trim()) errors.nickname = 'El nombre es requerido';

      if (type === 'card') {
        if (!cardNumber?.replace(/\s/g, '')) errors.cardNumber = 'El número de tarjeta es requerido';
        if (!cardName?.trim()) errors.cardName = 'El nombre en la tarjeta es requerido';
        if (!expiryMonth) errors.expiryMonth = 'El mes de vencimiento es requerido';
        if (!expiryYear) errors.expiryYear = 'El año de vencimiento es requerido';

        // Validar fecha de vencimiento
        if (expiryMonth && expiryYear) {
          const now = new Date();
          const expiry = new Date(expiryYear, expiryMonth - 1);
          if (expiry <= now) {
            errors.expiryMonth = 'La tarjeta está vencida';
          }
        }
      } else if (type === 'bank_account') {
        if (!bankName?.trim()) errors.bankName = 'El banco es requerido';
        if (!accountNumber?.trim()) errors.accountNumber = 'El número de cuenta es requerido';
        if (!accountName?.trim()) errors.accountName = 'El nombre de la cuenta es requerido';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Datos no válidos',
          errors
        });
      }

      // Si es el primer método o se marca como predeterminado, actualizar otros
      if (isDefault) {
        await query(
          'UPDATE user_payment_methods SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      // Verificar si es el primer método (automáticamente predeterminado)
      const existingCount = await query(
        'SELECT COUNT(*) as count FROM user_payment_methods WHERE user_id = ?',
        [userId]
      );
      const shouldBeDefault = isDefault || existingCount[0].count === 0;

      let insertData = {
        user_id: userId,
        type: type,
        nickname: nickname.trim(),
        is_default: shouldBeDefault ? 1 : 0
      };

      if (type === 'card') {
        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        const cardType = detectCardType(cleanCardNumber);
        
        // En producción, encriptar el número completo
        // const encryptedCard = encryptSensitiveData(cleanCardNumber);
        
        insertData = {
          ...insertData,
          // card_number_encrypted: encryptedCard.encrypted,
          // card_iv: encryptedCard.iv,
          last_four: getLastFour(cleanCardNumber),
          card_type: cardType,
          card_name: cardName.trim(),
          expiry_month: expiryMonth,
          expiry_year: expiryYear
        };
      } else if (type === 'bank_account') {
        // En producción, encriptar el número de cuenta
        // const encryptedAccount = encryptSensitiveData(accountNumber);
        
        insertData = {
          ...insertData,
          // account_number_encrypted: encryptedAccount.encrypted,
          // account_iv: encryptedAccount.iv,
          last_four: getLastFour(accountNumber),
          bank_name: bankName.trim(),
          account_type: accountType,
          account_name: accountName.trim()
        };
      }

      // Construir query dinámicamente
      const fields = Object.keys(insertData).join(', ');
      const placeholders = Object.keys(insertData).map(() => '?').join(', ');
      const values = Object.values(insertData);

      const result = await query(
        `INSERT INTO user_payment_methods (${fields}, created_at, updated_at) 
         VALUES (${placeholders}, NOW(), NOW())`,
        values
      );

      res.status(201).json({
        success: true,
        message: 'Método de pago agregado correctamente',
        data: { id: result.insertId }
      });

    } else {
      res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

  } catch (error) {
    console.error('Error en API de métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}