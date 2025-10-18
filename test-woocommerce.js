require('dotenv').config({ path: '.env.local' }); // Carga variables de entorno

const WooCommerceService = require('./services/woocommerce'); // Ajusta ruta si es necesario

async function testWooCommerce() {
  console.log('WOOCOMMERCE_URL:', process.env.WOOCOMMERCE_URL);

  try {
    const wooService = new WooCommerceService();

    const categories = await wooService.getCategories();
    console.log(`Categorías obtenidas: ${categories.length}`);

  } catch (error) {
    console.error('Error en prueba WooCommerce:', error.message);
  }
}

testWooCommerce();
