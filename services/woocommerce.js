const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

class WooCommerceService {
  constructor() {
    this.api = new WooCommerceRestApi({
      url: process.env.WOOCOMMERCE_URL,
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
      version: 'wc/v3'
    });

    console.log('WooCommerce base URL:', process.env.WOOCOMMERCE_API_URL);
  }

  async getProducts(params = {}) {
    try {
      console.log('Requesting products URL:', this.api.url + 'products');
      const { data } = await this.api.get('products', params);
      return data;
    } catch (error) {
      console.error('Error fetching products:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
  
  async getOrders(params = {}) {
    try {
      console.log('Requesting orders URL:', this.api.url + 'orders');
      const { data } = await this.api.get('orders', params);
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  // --- FUNCIÓN NUEVA QUE SOLUCIONA EL ERROR ---
  /**
   * Obtiene una lista de clientes de WooCommerce.
   * @param {object} params - Parámetros para la petición API (ej. { page: 1, per_page: 100 }).
   * @returns {Promise<Array>} - Una promesa que resuelve a un array de clientes.
   */
  async getCustomers(params = {}) {
    try {
      // El endpoint para clientes es 'customers'
      const { data } = await this.api.get('customers', params);
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
  // --- FIN DE LA FUNCIÓN NUEVA ---

}

module.exports = WooCommerceService;