// pages/api/epayco/create-payment.js - CORREGIDO
import { query } from "../../../lib/database";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      message: "Método no permitido" 
    });
  }

  try {
    console.log("🚀 Creando pago para ePayco Standard...");
    
    const {
      customer_data,
      shipping_address,
      notes,
      cart_summary,
      user_id
    } = req.body;

    // Validar datos requeridos
    if (!customer_data || !customer_data.name || !customer_data.email || !customer_data.document) {
      return res.status(400).json({
        success: false,
        message: "Datos del cliente incompletos"
      });
    }

    if (!shipping_address || !shipping_address.address || !shipping_address.city) {
      return res.status(400).json({
        success: false,
        message: "Dirección de envío incompleta"
      });
    }

    if (!cart_summary || !cart_summary.total) {
      return res.status(400).json({
        success: false,
        message: "Datos del carrito incompletos"
      });
    }

    // Generar número de orden único
    const generateOrderNumber = () => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5);
      return `JBC-${timestamp}-${random}`.toUpperCase();
    };

    const orderNumber = generateOrderNumber();
    const sessionId = user_id ? null : `session_${Date.now()}`;

    console.log("📋 Creando orden:", orderNumber);

    // Crear orden en la base de datos
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
      orderNumber,
      user_id || null,
      sessionId,
      "pending",
      "pending",
      "epayco",
      cart_summary.subtotal || 0,
      cart_summary.tax || 0,
      cart_summary.shipping || 15000,
      cart_summary.total,
      "COP",
      customer_data.email,
      customer_data.name.split(" ")[0] || customer_data.name,
      customer_data.name.split(" ").slice(1).join(" ") || "",
      customer_data.phone || null,
      JSON.stringify(shipping_address),
      JSON.stringify(shipping_address),
      notes || ""
    ]);

    const orderId = orderResult.insertId;
    console.log("✅ Orden creada con ID:", orderId);

    // Obtener items del carrito
    let cartItems = [];
    try {
      if (sessionId && !user_id) {
        cartItems = await query(`
          SELECT 
            ci.product_id,
            ci.quantity,
            p.name,
            p.price,
            p.sale_price
          FROM cart_items ci
          INNER JOIN products p ON ci.product_id = p.id
          WHERE ci.session_id = ? AND p.status = 'active'
        `, [sessionId]);
      } else if (user_id) {
        cartItems = await query(`
          SELECT 
            ci.product_id,
            ci.quantity,
            p.name,
            p.price,
            p.sale_price
          FROM cart_items ci
          INNER JOIN products p ON ci.product_id = p.id
          WHERE ci.user_id = ? AND p.status = 'active'
        `, [user_id]);
      }

      console.log(`📦 Encontrados ${cartItems.length} items en el carrito`);
    } catch (error) {
      console.warn("⚠️ Error obteniendo items del carrito:", error.message);
    }

    // Crear order_items
    if (cartItems.length > 0) {
      for (const item of cartItems) {
        const price = item.sale_price || item.price;
        const lineTotal = price * item.quantity;

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
          price,
          lineTotal
        ]);
      }
    } else {
      // Buscar o crear un producto genérico
      let genericProduct = await query(`
        SELECT id FROM products 
        WHERE name = 'Compra General' AND status = 'active' 
        LIMIT 1
      `);

      let genericProductId;
      
      if (genericProduct.length === 0) {
        // Crear producto genérico si no existe
        const createProductResult = await query(`
          INSERT INTO products (
            name,
            slug,
            description,
            price,
            status,
            manage_stock,
            stock_quantity,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          'Compra General',
          'compra-general',
          'Producto genérico para compras sin productos específicos',
          0,
          'active',
          false,
          999999
        ]);
        
        genericProductId = createProductResult.insertId;
        console.log('✅ Producto genérico creado con ID:', genericProductId);
      } else {
        genericProductId = genericProduct[0].id;
        console.log('✅ Usando producto genérico existente ID:', genericProductId);
      }

      // Crear item genérico con product_id válido
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
        genericProductId,
        'Compra en línea',
        1,
        cart_summary.total,
        cart_summary.total
      ]);
    }

    // CORRECCIÓN CRÍTICA: Generar firma MD5 con formato correcto
    const p_cust_id_cliente = process.env.EPAYCO_P_CUST_ID_CLIENTE;
    const p_key = process.env.EPAYCO_P_KEY;
    const amount = cart_summary.total;
    const currency = "COP";
    
    // IMPORTANTE: Usar ^ como separador
    const signatureString = `${p_cust_id_cliente}^${p_key}^${orderNumber}^${amount}^${currency}`;
    const p_signature = crypto.createHash("md5").update(signatureString).digest("hex");

    console.log("🔐 Generando firma de seguridad:", {
      customer_id: p_cust_id_cliente,
      p_key_exists: !!p_key,
      invoice: orderNumber,
      amount: amount,
      currency: currency,
      signature_string: signatureString, // Solo para debug
      signature: p_signature
    });

    // Calcular montos correctamente
    const totalAmount = cart_summary.total;
    const baseAmount = Math.round(totalAmount / 1.19); // Sin IVA
    const taxAmount = totalAmount - baseAmount; // Solo IVA

    // Determinar modo de prueba basado en el entorno
    const isProduction = process.env.NODE_ENV === 'production';
    const testMode = isProduction ? "FALSE" : "TRUE";

    console.log(`🔧 Modo de operación: ${isProduction ? 'PRODUCCIÓN' : 'PRUEBAS'}`);

    // Datos para ePayco Standard - FORMATO CORRECTO
    const epaycoData = {
      // Credenciales
      p_cust_id_cliente: p_cust_id_cliente,
      p_key: p_key,
      
      // Información de la compra
      p_id_invoice: orderNumber,
      p_description: `Compra en Judaica Breslov Colombia - ${cartItems.length || 1} producto(s)`,
      p_currency_code: "COP",
      p_amount: totalAmount.toString(),
      p_amount_base: baseAmount.toString(),
      p_tax: taxAmount.toString(),
      
      // Firma de seguridad (OBLIGATORIA)
      p_signature: p_signature,
      
      // Modo de prueba
     p_test_request: "FALSE",
      
      // URLs de respuesta
      p_url_response: process.env.EPAYCO_RESPONSE_URL || `${process.env.SITE_URL}/payment/response`,
      p_url_confirmation: process.env.EPAYCO_CONFIRMATION_URL || `${process.env.SITE_URL}/api/epayco/confirmation`,
      
      // Información del cliente (billing obligatorio)
      p_billing_document: customer_data.document,
      p_billing_name: customer_data.name,
      p_billing_address: shipping_address.address,
      p_billing_email: customer_data.email,
      p_billing_phone: customer_data.phone || "3000000000",
      p_billing_cellphone: customer_data.phone || "3000000000",
      p_billing_country: "CO",
      
      // Campos adicionales del cliente (opcional pero recomendado)
      p_customer_name: customer_data.name.split(" ")[0] || customer_data.name,
      p_customer_lastname: customer_data.name.split(" ").slice(1).join(" ") || "",
      p_customer_email: customer_data.email,
      p_customer_phone: customer_data.phone || "3000000000",
      p_customer_cellphone: customer_data.phone || "3000000000",
      p_customer_address: shipping_address.address,
      p_customer_country: "CO",
      p_customer_document: customer_data.document,
      p_customer_doc_type: "CC",
      
      // Extras para tracking
      p_extra1: orderNumber,
      p_extra2: orderId.toString(),
      p_extra3: "judaica_breslov"
    };

    console.log("💳 Datos para ePayco preparados:", {
      invoice: epaycoData.p_id_invoice,
      amount: epaycoData.p_amount,
      customer: epaycoData.p_billing_email,
      test_mode: epaycoData.p_test_request,
      customer_id: epaycoData.p_cust_id_cliente,
      signature_generated: !!p_signature,
      environment: process.env.NODE_ENV
    });

    // Devolver datos para el redirect
    res.status(200).json({
      success: true,
      message: "Orden creada exitosamente",
      data: {
        order_id: orderId,
        order_number: orderNumber,
        epayco_data: epaycoData,
        epayco_url: "https://secure.payco.co/checkout.php",
        redirect_method: "POST"
      }
    });

  } catch (error) {
    console.error("💥 Error creando pago:", error);
    
    const errorResponse = {
      success: false,
      message: "Error interno del servidor",
      debug_info: process.env.NODE_ENV !== 'production' ? {
        error_message: error.message,
        error_stack: error.stack,
        environment_check: {
          customer_id: !!process.env.EPAYCO_P_CUST_ID_CLIENTE,
          p_key: !!process.env.EPAYCO_P_KEY,
          site_url: !!process.env.SITE_URL,
          node_env: process.env.NODE_ENV
        }
      } : undefined
    };
    
    res.status(500).json(errorResponse);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
    externalResolver: true,
  },
};