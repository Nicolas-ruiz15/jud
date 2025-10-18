// services/epayco.js - Servicio simple para ePayco
import crypto from 'crypto';

class EpaycoService {
  constructor() {
    this.publicKey = process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY;
    this.privateKey = process.env.EPAYCO_PRIVATE_KEY;
    this.customerIdClient = process.env.EPAYCO_CUSTOMER_ID;
    this.pKey = process.env.EPAYCO_P_KEY;
    this.test = process.env.NODE_ENV !== 'production';
    this.baseUrl = this.test ? 'https://secure.epayco.co' : 'https://secure.epayco.co';
  }

  /**
   * Validar configuración de ePayco
   */
  validateConfig() {
    const required = ['publicKey', 'privateKey', 'customerIdClient', 'pKey'];
    const missing = required.filter(key => !this[key]);
    
    if (missing.length > 0) {
      throw new Error(`Configuración de ePayco incompleta. Faltan: ${missing.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Generar firma para validación de webhook
   */
  generateSignature(data) {
    const { ref_payco, transaction_id, amount, currency } = data;
    const signatureString = `${this.customerIdClient}^${this.pKey}^${ref_payco}^${transaction_id}^${amount}^${currency}`;
    
    return crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Validar firma de webhook de ePayco
   */
  validateSignature(data) {
    try {
      const expectedSignature = this.generateSignature(data);
      return expectedSignature === data.signature;
    } catch (error) {
      console.error('Error validando firma:', error);
      return false;
    }
  }

  /**
   * Validar webhook de ePayco
   */
  validateWebhook(webhookData) {
    try {
      // Verificar campos requeridos
      const requiredFields = [
        'x_ref_payco',
        'x_transaction_id', 
        'x_amount',
        'x_currency_code',
        'x_signature'
      ];

      for (const field of requiredFields) {
        if (!webhookData[field]) {
          return {
            valid: false,
            reason: `Campo requerido faltante: ${field}`
          };
        }
      }

      // Validar firma
      const signatureData = {
        ref_payco: webhookData.x_ref_payco,
        transaction_id: webhookData.x_transaction_id,
        amount: webhookData.x_amount,
        currency: webhookData.x_currency_code,
        signature: webhookData.x_signature
      };

      if (!this.validateSignature(signatureData)) {
        return {
          valid: false,
          reason: 'Firma inválida'
        };
      }

      return {
        valid: true,
        data: webhookData
      };

    } catch (error) {
      return {
        valid: false,
        reason: `Error validando webhook: ${error.message}`
      };
    }
  }

  /**
   * Procesar datos de confirmación de ePayco
   */
  processConfirmation(confirmationData) {
    const {
      x_cod_response,
      x_response,
      x_transaction_state,
      x_approval_code,
      x_bank_name,
      x_amount,
      x_tax,
      x_amount_base
    } = confirmationData;

    // Determinar estado del pago
    let paymentStatus = 'failed';
    let orderStatus = 'failed';

    // Códigos de respuesta de ePayco:
    // 1 = Aceptada, 2 = Rechazada, 3 = Pendiente, 4 = Fallida
    switch (x_cod_response) {
      case '1': // Aceptada
        if (x_transaction_state === '1') { // Aprobada
          paymentStatus = 'paid';
          orderStatus = 'processing';
        }
        break;
      case '3': // Pendiente
        paymentStatus = 'pending';
        orderStatus = 'pending';
        break;
      case '2': // Rechazada
      case '4': // Fallida
      default:
        paymentStatus = 'failed';
        orderStatus = 'failed';
        break;
    }

    return {
      paymentStatus,
      orderStatus,
      isSuccessful: paymentStatus === 'paid',
      isPending: paymentStatus === 'pending',
      details: {
        response: x_response,
        approvalCode: x_approval_code,
        bank: x_bank_name,
        amount: parseFloat(x_amount || 0),
        tax: parseFloat(x_tax || 0),
        base: parseFloat(x_amount_base || 0)
      }
    };
  }
}

export default EpaycoService;