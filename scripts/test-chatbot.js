// test-chatbot.js - SCRIPT PARA TESTING Y DEBUGGING

import { ImprovedIntentClassifier } from './lib/chatbot/intents-improved.js';
import { SimplifiedChatbotEngine } from './lib/chatbot/engine-simplified.js';

class ChatbotTester {
  constructor() {
    this.engine = null;
    this.testCases = [
      // CASOS PROBLEMÁTICOS IDENTIFICADOS
      {
        input: "tienes envios?",
        expectedIntent: "shipping_inquiry",
        description: "Consulta básica de envíos"
      },
      {
        input: "quiero comprar un tallit para mi mama", 
        expectedIntent: "product_search",
        description: "Búsqueda específica de producto"
      },
      {
        input: "quiero comprar un libro del rabino shalom arush",
        expectedIntent: "product_search", 
        description: "Búsqueda de libro específico"
      },
      {
        input: "precio de emunah",
        expectedIntent: "product_search",
        description: "Consulta de precio"
      },
      {
        input: "hola buenos dias",
        expectedIntent: "greeting",
        description: "Saludo básico"
      },
      {
        input: "gracias",
        expectedIntent: "thanks", 
        description: "Agradecimiento"
      },
      {
        input: "el 1",
        expectedIntent: "product_reference",
        description: "Referencia numérica"
      },
      {
        input: "whatsapp",
        expectedIntent: "contact_request",
        description: "Solicitud de contacto"
      }
    ];
  }

  async initialize() {
    console.log('🚀 Inicializando tester...');
    this.engine = new SimplifiedChatbotEngine();
    await this.engine.initialize();
    console.log('✅ Tester inicializado\n');
  }

  async runAllTests() {
    if (!this.engine) {
      await this.initialize();
    }

    console.log('🧪 EJECUTANDO TESTS COMPLETOS\n');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    for (const testCase of this.testCases) {
      const result = await this.runSingleTest(testCase);
      if (result) passed++;
      else failed++;
      
      console.log('-'.repeat(60));
    }

    console.log('\n📊 RESULTADOS FINALES:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return { passed, failed, total: passed + failed };
  }

  async runSingleTest(testCase) {
    console.log(`\n🧪 TEST: "${testCase.input}"`);
    console.log(`📝 Descripción: ${testCase.description}`);
    console.log(`🎯 Intent esperado: ${testCase.expectedIntent}`);

    try {
      const result = await this.engine.processMessage(
        testCase.input, 
        'test', 
        'test-session', 
        {}
      );

      console.log(`🔍 Intent detectado: ${result.intent}`);
      console.log(`📊 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`🛍️ Productos encontrados: ${result.products.length}`);
      console.log(`📤 Respuesta: ${result.response.substring(0, 100)}...`);

      const intentMatch = result.intent === testCase.expectedIntent;
      const hasGoodConfidence = result.confidence > 0.5;
      
      if (intentMatch && hasGoodConfidence) {
        console.log('✅ TEST PASSED');
        return true;
      } else {
        console.log('❌ TEST FAILED');
        if (!intentMatch) {
          console.log(`   Razón: Intent incorrecto (esperado: ${testCase.expectedIntent}, obtenido: ${result.intent})`);
        }
        if (!hasGoodConfidence) {
          console.log(`   Razón: Confianza baja (${(result.confidence * 100).toFixed(1)}%)`);
        }
        return false;
      }

    } catch (error) {
      console.log('❌ TEST ERROR');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  // DEBUGGING ESPECÍFICO PARA "tienes envios?"
  async debugShippingQuery() {
    console.log('\n🔬 DEBUGGING ESPECÍFICO: "tienes envios?"');
    console.log('='.repeat(50));

    const message = "tienes envios?";
    
    // 1. Test de clasificación de intención
    console.log('\n1. 🎯 CLASIFICACIÓN DE INTENCIÓN:');
    const classifier = new ImprovedIntentClassifier();
    await classifier.initialize();
    
    const intent = await classifier.classify(message);
    console.log(`   Intent: ${intent.type}`);
    console.log(`   Confianza: ${(intent.confidence * 100).toFixed(1)}%`);
    console.log(`   Entidades: ${JSON.stringify(intent.entities)}`);

    // 2. Test de patrones específicos
    console.log('\n2. 🔍 TEST DE PATRONES:');
    const shippingPatterns = [
      /^(?:tienes?|tienen|hacen|realizan)\s+envíos?\??$/i,
      /^envíos?\??$/i,
      /^(?:hacen|realizan)\s+(?:envíos?|entregas?)\??$/i
    ];

    shippingPatterns.forEach((pattern, index) => {
      const matches = pattern.test(message.toLowerCase());
      console.log(`   Patrón ${index + 1}: ${matches ? '✅' : '❌'} - ${pattern.source}`);
    });

    // 3. Test completo del motor
    console.log('\n3. 🔄 MOTOR COMPLETO:');
    if (!this.engine) await this.initialize();
    
    const fullResult = await this.engine.processMessage(message, 'test', 'debug-session', {});
    console.log(`   Resultado: ${JSON.stringify(fullResult, null, 2)}`);

    return fullResult;
  }

  // TEST ESPECÍFICO DE BÚSQUEDA DE PRODUCTOS
  async debugProductSearch() {
    console.log('\n🔬 DEBUGGING BÚSQUEDA DE PRODUCTOS');
    console.log('='.repeat(50));

    const testQueries = [
      "precio de emunah",
      "quiero comprar un sidur", 
      "libros de shalom arush",
      "tallit para mi mama"
    ];

    for (const query of testQueries) {
      console.log(`\n🔍 Query: "${query}"`);
      
      try {
        if (!this.engine) await this.initialize();
        const result = await this.engine.processMessage(query, 'test', 'search-session', {});
        
        console.log(`   Intent: ${result.intent}`);
        console.log(`   Productos: ${result.products.length}`);
        
        if (result.products.length > 0) {
          console.log('   Productos encontrados:');
          result.products.slice(0, 3).forEach((product, idx) => {
            console.log(`     ${idx + 1}. ${product.name} - $${product.price}`);
          });
        } else {
          console.log('   ❌ No se encontraron productos');
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  // MÉTODO PARA TESTING INTERACTIVO
  async interactiveTest() {
    console.log('\n💬 MODO INTERACTIVO (escribe "exit" para salir)');
    console.log('='.repeat(50));
    
    if (!this.engine) await this.initialize();

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = () => {
      rl.question('\nTu mensaje: ', async (input) => {
        if (input.toLowerCase() === 'exit') {
          rl.close();
          return;
        }

        try {
          const result = await this.engine.processMessage(input, 'interactive', 'interactive-session', {});
          console.log('\n🤖 Respuesta del bot:');
          console.log(result.response);
          console.log(`\n📊 Metadata: Intent=${result.intent}, Confianza=${(result.confidence * 100).toFixed(1)}%, Productos=${result.products.length}`);
          
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
        }

        askQuestion();
      });
    };

    askQuestion();
  }
}

// FUNCIÓN PRINCIPAL PARA EJECUTAR TESTS
async function runTests() {
  const tester = new ChatbotTester();
  
  console.log('🎯 CHATBOT TESTING SUITE');
  console.log('========================');
  
  // 1. Tests automáticos
  await tester.runAllTests();
  
  // 2. Debugging específico
  await tester.debugShippingQuery();
  await tester.debugProductSearch();
  
  // 3. Test interactivo (opcional)
  // await tester.interactiveTest();
}

// EJECUTAR SI ES ARCHIVO PRINCIPAL
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { ChatbotTester, runTests };
export default ChatbotTester;