// pages/api/simple-diagnostic.js - DIAGNÓSTICO SIMPLE PARA PLESK
import { query } from '../../lib/database';

export default async function handler(req, res) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    tests: {},
    recommendations: [],
    overallStatus: 'unknown'
  };

  try {
    // Test 1: Conexión básica a BD
    diagnostics.tests.database = await testDatabase();
    
    // Test 2: Tabla products
    diagnostics.tests.products = await testProducts();
    
    // Test 3: Importación del motor
    diagnostics.tests.engineImport = await testEngineImport();
    
    // Test 4: Análisis básico de intención
    diagnostics.tests.intentAnalysis = await testIntentAnalysis();
    
    // Test 5: Contexto de conversación
    diagnostics.tests.conversationContext = await testConversationContext();

    // Determinar status general
    const failedTests = Object.values(diagnostics.tests).filter(t => !t.success).length;
    const totalTests = Object.keys(diagnostics.tests).length;
    
    if (failedTests === 0) {
      diagnostics.overallStatus = 'healthy';
      diagnostics.recommendations.push('✅ Todo parece estar funcionando correctamente');
    } else {
      diagnostics.overallStatus = 'issues_detected';
      diagnostics.recommendations.push(`❌ ${failedTests}/${totalTests} tests fallaron`);
    }

    res.status(200).json({
      success: true,
      diagnostics,
      summary: {
        totalTests,
        failedTests,
        status: diagnostics.overallStatus
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      diagnostics
    });
  }
}

async function testDatabase() {
  try {
    const result = await query('SELECT 1 as test');
    return {
      success: true,
      message: 'Conexión a BD exitosa',
      result: result[0]
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error conectando a BD',
      error: error.message
    };
  }
}

async function testProducts() {
  try {
    // Detectar estructura de products
    const structure = await query('DESCRIBE products');
    const fields = structure.map(s => s.Field);
    
    // Contar productos
    const countResult = await query('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    const productCount = countResult[0].count;
    
    // Obtener muestra
    const sampleQuery = `
      SELECT id, name, ${fields.includes('price') ? 'price' : '0 as price'}
      FROM products 
      WHERE is_active = 1 
      LIMIT 3
    `;
    const sample = await query(sampleQuery);
    
    return {
      success: productCount > 0,
      message: `${productCount} productos encontrados`,
      data: {
        productCount,
        fields: fields.length,
        sampleProducts: sample.map(p => ({ id: p.id, name: p.name, price: p.price })),
        hasRequiredFields: {
          name: fields.includes('name'),
          price: fields.includes('price'),
          is_active: fields.includes('is_active')
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error accediendo a productos',
      error: error.message
    };
  }
}

async function testEngineImport() {
  try {
    // Verificar que podemos importar las funciones
    const { generateIntelligentResponse } = await import('../../lib/intelligent-chatbot-engine');
    
    return {
      success: typeof generateIntelligentResponse === 'function',
      message: 'Motor inteligente importado correctamente',
      type: typeof generateIntelligentResponse
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error importando motor inteligente',
      error: error.message
    };
  }
}

async function testIntentAnalysis() {
  try {
    // Test básico de análisis sin BD
    const testMessage = 'hola';
    const keywords = extractBasicKeywords(testMessage);
    
    return {
      success: true,
      message: 'Análisis básico funciona',
      data: {
        originalMessage: testMessage,
        keywords,
        detectedIntent: keywords.includes('hola') ? 'greeting' : 'unknown'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error en análisis de intención',
      error: error.message
    };
  }
}

async function testConversationContext() {
  try {
    // Verificar tabla de contexto
    const contextTest = await query('SELECT COUNT(*) as count FROM chat_conversation_context');
    
    return {
      success: true,
      message: 'Tabla de contexto accesible',
      data: {
        contextRecords: contextTest[0].count
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error accediendo a contexto',
      error: error.message
    };
  }
}

// Función básica para extraer keywords sin dependencias
function extractBasicKeywords(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 1);
}