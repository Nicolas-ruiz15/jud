// pages/api/test-super-bot.js - ENDPOINT DE PRUEBA SÚPER COMPLETO
import { 
  testIntelligentEngine, 
  getIntelligentStats 
} from '../../lib/intelligent-chatbot-engine';
import { query } from '../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { test, message } = req.query;

  try {
    let result;

    switch (test) {
      case 'products':
        result = await testProductConnection();
        break;
        
      case 'engine':
        const testMessage = message || 'hola, busco un tefilin para mi hijo que hace bar mitzvah';
        result = await testIntelligentEngine(testMessage);
        break;
        
      case 'stats':
        result = await getIntelligentStats();
        break;
        
      case 'database':
        result = await testDatabaseConnection();
        break;
        
      case 'full':
        result = await runFullTest();
        break;
        
      default:
        // Dashboard completo
        result = await createTestDashboard();
    }

    res.status(200).json({
      success: true,
      test: test || 'dashboard',
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function testProductConnection() {
  console.log('🧪 Testing product database connection...');
  
  try {
    // Primero verificar estructura de la tabla products
    const tableStructure = await query(`DESCRIBE products`);
    console.log('📋 Estructura de tabla products:', tableStructure.map(t => t.Field));

    // Verificar qué campos de stock existen
    const stockFields = tableStructure.filter(t => 
      t.Field.toLowerCase().includes('stock') || 
      t.Field.toLowerCase().includes('quantity') ||
      t.Field.toLowerCase().includes('inventory')
    );
    console.log('📦 Campos de stock encontrados:', stockFields.map(f => f.Field));

    // Consulta adaptada a tu estructura
    const products = await query(`
      SELECT 
        p.id, p.name, p.price, p.discount_price,
        p.is_active, p.status, p.category_id,
        ${stockFields.length > 0 ? stockFields[0].Field : '0'} as stock_quantity,
        c.name as category_name,
        COUNT(*) OVER() as total_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    const categories = await query(`
      SELECT c.name, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
    `);

    // Verificar productos activos con diferentes filtros
    const activeProducts = await query(`
      SELECT 
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_products,
        COUNT(CASE WHEN is_active = 1 AND status = 'published' THEN 1 END) as published_products,
        COUNT(*) as total_products
      FROM products
    `);

    return {
      success: true,
      tableStructure: tableStructure.map(t => ({field: t.Field, type: t.Type})),
      stockFields: stockFields.map(f => f.Field),
      productsFound: products.length,
      totalProducts: products[0]?.total_count || 0,
      activeProducts: activeProducts[0]?.active_products || 0,
      publishedProducts: activeProducts[0]?.published_products || 0,
      categoriesFound: categories.length,
      sampleProducts: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        discount_price: p.discount_price,
        stock: p.stock_quantity,
        category: p.category_name,
        status: p.status
      })),
      categories: categories.slice(0, 5),
      recommendations: products.length === 0 ? [
        '⚠️ No hay productos activos encontrados',
        '💡 Verificar que products.is_active = 1',
        '💡 Verificar que products.status = "published" si aplica'
      ] : [
        '✅ Productos encontrados correctamente',
        `📊 ${activeProducts[0]?.active_products} productos activos de ${activeProducts[0]?.total_products} totales`
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      suggestion: 'Verificar estructura de la tabla products y permisos de BD'
    };
  }
}

async function testDatabaseConnection() {
  console.log('🧪 Testing complete database connection...');
  
  const tests = [];
  
  // Test tablas principales
  const tablesToTest = [
    'products', 'categories', 'chat_conversations', 'chat_messages',
    'chat_bot_knowledge_enhanced', 'chat_conversation_context'
  ];
  
  for (const table of tablesToTest) {
    try {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
      tests.push({
        table,
        status: 'success',
        recordCount: result[0].count
      });
    } catch (error) {
      tests.push({
        table,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return {
    databaseTests: tests,
    overallStatus: tests.every(t => t.status === 'success') ? 'healthy' : 'issues_detected'
  };
}

async function runFullTest() {
  console.log('🧪 Running comprehensive test suite...');
  
  const results = {};
  
  // Test 1: Database connectivity
  results.database = await testDatabaseConnection();
  
  // Test 2: Product connection
  results.products = await testProductConnection();
  
  // Test 3: Engine stats
  results.stats = await getIntelligentStats();
  
  // Test 4: Engine with various messages
  const testMessages = [
    'hola',
    'busco un tefilin',
    'cuanto cuesta un tallit',
    'tienen envios a bogota',
    'necesito hablar con alguien',
    'que libros de cabala tienen',
    'es para un bar mitzvah'
  ];
  
  results.engineTests = {};
  for (const msg of testMessages) {
    try {
      const engineResult = await testIntelligentEngine(msg);
      results.engineTests[msg] = {
        success: engineResult.success,
        intent: engineResult.response?.intent,
        confidence: engineResult.response?.confidence,
        hasResponse: !!engineResult.response?.response
      };
    } catch (error) {
      results.engineTests[msg] = {
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
}

async function createTestDashboard() {
  console.log('📊 Creating test dashboard...');
  
  const dashboard = {
    systemInfo: {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      testEndpoint: '/api/test-super-bot'
    },
    quickTests: {
      '/api/test-super-bot?test=products': 'Test product database connection',
      '/api/test-super-bot?test=engine&message=hola': 'Test engine with custom message',
      '/api/test-super-bot?test=stats': 'Get engine statistics',
      '/api/test-super-bot?test=database': 'Test all database tables',
      '/api/test-super-bot?test=full': 'Run complete test suite'
    },
    recommendations: []
  };
  
  // Test básico de productos
  try {
    const productTest = await testProductConnection();
    dashboard.productStatus = {
      status: productTest.success ? 'healthy' : 'error',
      totalProducts: productTest.totalProducts || 0,
      categoriesCount: productTest.categoriesFound || 0
    };
    
    if (productTest.totalProducts === 0) {
      dashboard.recommendations.push('⚠️ No hay productos en la base de datos. Agregar productos de muestra.');
    }
  } catch (error) {
    dashboard.productStatus = {
      status: 'error',
      error: error.message
    };
    dashboard.recommendations.push('❌ Error conectando con productos. Verificar tabla products.');
  }
  
  // Test básico del engine
  try {
    const engineStats = await getIntelligentStats();
    dashboard.engineStatus = {
      status: engineStats.error ? 'error' : 'healthy',
      productCount: engineStats.productCount || 0,
      categoryCount: engineStats.categoryCount || 0,
      cacheValid: engineStats.cacheValid || false
    };
    
    if (engineStats.productCount === 0) {
      dashboard.recommendations.push('⚠️ El engine no encuentra productos. Verificar cache y BD.');
    }
  } catch (error) {
    dashboard.engineStatus = {
      status: 'error',
      error: error.message
    };
    dashboard.recommendations.push('❌ Error en el engine inteligente. Verificar intelligent-chatbot-engine.js');
  }
  
  // Test rápido de chat knowledge
  try {
    const knowledgeCount = await query('SELECT COUNT(*) as count FROM chat_bot_knowledge_enhanced WHERE is_active = 1');
    dashboard.knowledgeStatus = {
      status: 'healthy',
      activeRules: knowledgeCount[0].count
    };
    
    if (knowledgeCount[0].count === 0) {
      dashboard.recommendations.push('⚠️ No hay reglas de conocimiento activas en chat_bot_knowledge_enhanced.');
    }
  } catch (error) {
    dashboard.knowledgeStatus = {
      status: 'error',
      error: error.message
    };
    dashboard.recommendations.push('❌ Error accediendo a chat_bot_knowledge_enhanced.');
  }
  
  // Determinar status general
  const allStatuses = [
    dashboard.productStatus?.status,
    dashboard.engineStatus?.status,
    dashboard.knowledgeStatus?.status
  ];
  
  dashboard.overallStatus = allStatuses.every(s => s === 'healthy') ? 
    'all_systems_go' : 'needs_attention';
  
  if (dashboard.overallStatus === 'all_systems_go') {
    dashboard.recommendations.push('✅ ¡Todo está funcionando perfectamente! El bot debería responder inteligentemente.');
  }
  
  return dashboard;
}

// Función auxiliar para formatear respuestas
function formatTestResponse(result) {
  if (!result) return 'No result';
  
  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2);
  }
  
  return result.toString();
}