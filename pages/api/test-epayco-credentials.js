// pages/api/test-epayco-credentials.js - Verificar credenciales
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 Verificando credenciales de ePayco...');
    
    // Verificar que las variables estén cargadas
    const credentials = {
      customer_id: process.env.EPAYCO_P_CUST_ID_CLIENTE,
      p_key: process.env.EPAYCO_P_KEY,
      private_key: process.env.EPAYCO_PRIVATE_KEY,
      site_url: process.env.SITE_URL,
      node_env: process.env.NODE_ENV
    };

    console.log('📋 Credenciales encontradas:', {
      customer_id: credentials.customer_id ? '✅ Presente' : '❌ Faltante',
      p_key: credentials.p_key ? '✅ Presente' : '❌ Faltante',
      private_key: credentials.private_key ? '✅ Presente' : '❌ Faltante',
      site_url: credentials.site_url ? '✅ Presente' : '❌ Faltante',
      node_env: credentials.node_env
    });

    // Preparar datos de prueba mínimos para ePayco
    const testData = {
      p_cust_id_cliente: credentials.customer_id,
      p_key: credentials.p_key,
      p_id_invoice: `TEST-${Date.now()}`,
      p_description: 'Test de credenciales',
      p_amount: '1000',
      p_amount_base: '840',
      p_tax: '160',
      p_currency_code: 'COP',
      p_cust_name: 'Test',
      p_cust_last_name: 'User',
      p_cust_email: 'test@test.com',
      p_cust_phone: '3000000000',
      p_cust_address: 'Test Address',
      p_cust_city: 'Bogota',
      p_cust_country: 'CO',
      p_cust_document: '12345678',
      p_cust_doc_type: 'CC',
      p_url_response: `${credentials.site_url}/payment/response`,
      p_url_confirmation: `${credentials.site_url}/api/epayco/confirmation`,
      p_test_request: 'TRUE', // Siempre en modo prueba para este test
      p_split_payco: 'FALSE',
      p_split_type: 'false',
      p_split_app: 'FALSE',
      p_split_merchant: 'FALSE'
    };

    // Verificar si todas las credenciales están presentes
    const missingCredentials = [];
    if (!credentials.customer_id) missingCredentials.push('EPAYCO_P_CUST_ID_CLIENTE');
    if (!credentials.p_key) missingCredentials.push('EPAYCO_P_KEY');
    if (!credentials.private_key) missingCredentials.push('EPAYCO_PRIVATE_KEY');
    if (!credentials.site_url) missingCredentials.push('SITE_URL');

    if (missingCredentials.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Credenciales faltantes',
        missing: missingCredentials,
        found_credentials: credentials
      });
    }

    // Intentar una llamada de prueba a ePayco (simulado)
    console.log('🧪 Datos de prueba preparados para ePayco:', {
      customer_id: testData.p_cust_id_cliente,
      invoice: testData.p_id_invoice,
      amount: testData.p_amount,
      test_mode: testData.p_test_request
    });

    res.status(200).json({
      success: true,
      message: 'Credenciales cargadas correctamente',
      data: {
        credentials_status: {
          customer_id: !!credentials.customer_id,
          p_key: !!credentials.p_key,
          private_key: !!credentials.private_key,
          site_url: !!credentials.site_url
        },
        test_data_sample: {
          customer_id: testData.p_cust_id_cliente,
          invoice: testData.p_id_invoice,
          amount: testData.p_amount,
          test_mode: testData.p_test_request,
          urls: {
            response: testData.p_url_response,
            confirmation: testData.p_url_confirmation
          }
        },
        environment: {
          node_env: credentials.node_env,
          debug_epayco: process.env.DEBUG_EPAYCO
        },
        next_steps: [
          '1. Verificar que tu cuenta de ePayco esté activa',
          '2. Confirmar que las credenciales sean correctas en el panel',
          '3. Verificar que la cuenta tenga permisos para procesar pagos',
          '4. Contactar soporte de ePayco si persiste el 403'
        ]
      }
    });

  } catch (error) {
    console.error('💥 Error verificando credenciales:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error verificando credenciales',
      error: error.message,
      stack: process.env.DEBUG_EPAYCO === 'true' ? error.stack : undefined
    });
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};