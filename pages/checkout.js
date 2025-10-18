// pages/checkout.js - CORREGIDO sin conflictos de useEffect
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading, formatPrice } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [epaycoLoaded, setEpaycoLoaded] = useState(false);
  
  // Estados para datos del cliente
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    document: ''
  });
  
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Colombia'
  });

  // Estados para direcciones y métodos guardados
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState('');
  const [selectedSavedPayment, setSelectedSavedPayment] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [useNewPayment, setUseNewPayment] = useState(true);

  const [notes, setNotes] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // 🔧 INTERCEPTOR CORS SIMPLE - Definido fuera de useEffect
  const setupCorsInterceptor = () => {
    if (window.fetch._epaycoPatched) {
      console.log('🔧 Interceptor ya configurado');
      return;
    }
    
    console.log('🔧 Configurando interceptor CORS...');
    
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
      const [url, options] = args;
      
      // Solo interceptar getip de ePayco
      if (typeof url === 'string' && url.includes('apify-private.epayco.co/getip')) {
        console.log('🔄 INTERCEPTANDO GETIP! Redirigiendo al proxy...');
        
        return originalFetch('/api/epayco/getip', {
          method: 'GET',
          headers: { 'Accept': '*/*' }
        }).then(response => {
          console.log('✅ Proxy respondió con status:', response.status);
          return response;
        }).catch(error => {
          console.warn('⚠️ Error en proxy:', error);
          return new Response('181.129.183.19', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      }
      
      return originalFetch.apply(this, args);
    };
    
    window.fetch._epaycoPatched = true;
    console.log('✅ Interceptor CORS configurado');
  };

  // 🚨 UN SOLO useEffect para ePayco - SIN DUPLICADOS
  useEffect(() => {
    // Configurar interceptor inmediatamente
    setupCorsInterceptor();
    
    // Función para cargar ePayco
    const loadEpaycoScript = () => {
      if (window.ePayco) {
        console.log('✅ ePayco ya cargado');
        setEpaycoLoaded(true);
        return;
      }

      console.log('📦 Cargando ePayco...');
      
      // Remover scripts existentes
      const existingScript = document.querySelector('script[src="https://checkout.epayco.co/checkout.js"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://checkout.epayco.co/checkout.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ ePayco cargado exitosamente');
        setEpaycoLoaded(true);
      };
      
      script.onerror = () => {
        console.error('❌ Error cargando ePayco');
        toast.error('Error cargando sistema de pagos');
      };
      
      document.head.appendChild(script);
    };

    // Cargar después de configurar interceptor
    setTimeout(loadEpaycoScript, 100);
    
  }, []); // Solo se ejecuta una vez

  // Cargar datos del usuario autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
      
      loadSavedAddresses();
      loadSavedPaymentMethods();
    }
  }, [isAuthenticated, user]);

  // Verificar que hay items en el carrito
  useEffect(() => {
    if (!cartLoading && cart.items.length === 0) {
      toast.error('Tu carrito está vacío');
      router.push('/carrito');
    }
  }, [cartLoading, cart.items.length, router]);

  // Limpiar eventos globales al desmontar
  useEffect(() => {
    return () => {
      if (window.epaycoResponse) {
        delete window.epaycoResponse;
      }
      if (window.epaycoClose) {
        delete window.epaycoClose;
      }
    };
  }, []);

  // Cargar direcciones guardadas
  const loadSavedAddresses = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('/api/user/addresses', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedAddresses(data.data || []);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  // Cargar métodos de pago guardados
  const loadSavedPaymentMethods = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('/api/user/payment-methods', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedPaymentMethods(data.data || []);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  // Manejar selección de dirección guardada
  const handleSavedAddressChange = (addressId) => {
    setSelectedSavedAddress(addressId);
    
    if (addressId && addressId !== 'new') {
      const address = savedAddresses.find(addr => addr.id.toString() === addressId);
      if (address) {
        setShippingAddress({
          address: address.address,
          city: address.city,
          state: address.department || address.state || '',
          postal_code: address.zipCode || address.postal_code || '',
          country: 'Colombia'
        });
        setUseNewAddress(false);
      }
    } else if (addressId === 'new') {
      setUseNewAddress(true);
      setShippingAddress({
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Colombia'
      });
    }
  };

  // Calcular totales
  const subtotal = cart.summary?.subtotal || 0;
  const shipping = selectedPaymentMethod === 'bank_transfer' ? 0 : (cart.summary?.shipping || 18000);
  const tax = 0;
  const total = subtotal + shipping + tax;
  const calculations = { subtotal, shipping, tax, total };

  // Validar formulario
  const validateForm = () => {
    if (!customerData.name.trim()) {
      toast.error('El nombre es requerido');
      return false;
    }
    if (!customerData.email.trim()) {
      toast.error('El email es requerido');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(customerData.email)) {
      toast.error('El email no es válido');
      return false;
    }
    if (!customerData.document.trim()) {
      toast.error('El número de documento es requerido');
      return false;
    }
    if (!shippingAddress.address.trim()) {
      toast.error('La dirección es requerida');
      return false;
    }
    if (!shippingAddress.city.trim()) {
      toast.error('La ciudad es requerida');
      return false;
    }
    if (!selectedPaymentMethod) {
      toast.error('Selecciona un método de pago');
      return false;
    }
    return true;
  };


  // Función ePayco
  const handleEpaycoPayment = async () => {
    if (!validateForm()) return;
    
    if (!window.ePayco) {
      toast.error('Sistema de pagos no disponible. Intenta recargar la página.');
      return;
    }

    setLoading(true);

    try {
      // 🆕 CREAR PEDIDO PRIMERO
      const orderData = {
        customer_data: {
          name: customerData.name.trim(),
          email: customerData.email.trim(),
          phone: customerData.phone?.trim() || '',
          document: customerData.document.trim()
        },
        shipping_address: {
          address: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state?.trim() || '',
          country: 'Colombia'
        },
        payment_method: 'epayco',
        notes: notes.trim()
      };

      if (user?.id) {
        orderData.user_id = user.id;
      }

      console.log('🆕 Creando pedido antes de ePayco...');
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      const orderResult = await orderResponse.json();
      
      if (!orderResult.success) {
        toast.error(orderResult.message || 'Error al crear el pedido');
        setLoading(false);
        return;
      }

      console.log('✅ Pedido creado:', orderResult.data.order_number);

      // 🆕 AHORA ABRIR EPAYCO
      console.log('🚀 Iniciando pago con ePayco...');
      
      const handler = window.ePayco.checkout.configure({
        key: 'a76d706c8256203b156594f5c6babd47',
        test: false
      });

      const extraData = {
        customer_data: {
          name: customerData.name.trim(),
          email: customerData.email.trim(),
          phone: customerData.phone?.trim() || '',
          document: customerData.document.trim()
        },
        shipping_address: {
          address: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state?.trim() || '',
          country: 'Colombia'
        },
        notes: notes.trim(),
        cart_summary: calculations
      };

      if (user?.id) {
        extraData.user_id = user.id;
      }

      const data = {
        name: "Compra Judaica Breslov",
        description: `${cart.items.length} producto(s) - Judaica Breslov Colombia`,
        invoice: orderResult.data.order_number, // 🆕 USAR ORDER NUMBER REAL
        currency: "cop",
        amount: total.toString(),
        tax_base: subtotal.toString(),
        tax: tax.toString(),
        country: "co",
        lang: "es",
        external: "false",
        response: `${window.location.origin}/payment/response`,
        confirmation: `${window.location.origin}/api/payments/epayco/confirmation`,
        name_billing: customerData.name,
        email_billing: customerData.email,
        address_billing: shippingAddress.address,
        type_doc_billing: "cc",
        mobilephone_billing: customerData.phone || "3000000000",
        number_doc_billing: customerData.document,
        extra1: JSON.stringify(extraData),
        extra2: `session_${Date.now()}`,
        extra3: "judaica_breslov"
      };

      console.log('💳 Datos preparados:', {
        invoice: data.invoice,
        amount: data.amount,
        email: data.email_billing
      });

      window.epaycoResponse = function(response) {
        setLoading(false);
        if (response.success) {
          const params = new URLSearchParams(response);
          window.location.href = `/payment/response?${params.toString()}`;
        } else {
          toast.error(response.reason || 'Error en el pago');
        }
      };

      window.epaycoClose = function() {
        setLoading(false);
      };

      handler.open(data);
      console.log('✅ Checkout abierto');

    } catch (error) {
      console.error('💥 Error:', error);
      setLoading(false);
      toast.error(`Error: ${error.message}`);
    }
  };
 const handleBankTransfer = async () => {
  if (!validateForm()) return;

  setLoading(true);
  try {
    console.log('🏦 Iniciando proceso de transferencia bancaria...');
    
    const orderData = {
      customer_data: {
        name: customerData.name.trim(),
        email: customerData.email.trim(),
        phone: customerData.phone?.trim() || '',
        document: customerData.document.trim()
      },
      shipping_address: {
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state?.trim() || '',
        postal_code: shippingAddress.postal_code?.trim() || '',
        country: 'Colombia'
      },
      payment_method: 'bank_transfer',
      notes: notes.trim()
    };

    if (user?.id) {
      orderData.user_id = user.id;
    }
    
    if (selectedSavedAddress && selectedSavedAddress !== 'new') {
      orderData.selected_address_id = selectedSavedAddress;
    }

    console.log('📤 Enviando datos del pedido:', orderData);

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    console.log('📥 Respuesta del servidor:', result);
    
    if (result.success) {
      console.log('✅ Pedido creado exitosamente:', result.data.order_number);
      toast.success('¡Pedido creado exitosamente!');
      
      // Redirigir a página de transferencia
      window.location.href = `/payment/bank-transfer/${result.data.order_id}`;
    } else {
      console.error('❌ Error en respuesta:', result.message);
      toast.error(result.message || 'Error al crear la orden');
    }
  } catch (error) {
    console.error('💥 Error en transferencia:', error);
    toast.error('Error al procesar el pedido. Por favor intenta de nuevo.');
  } finally {
    setLoading(false);
  }
};
  if (cartLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (cart.items.length === 0) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Checkout - Judaica Breslov Colombia</title>
        <meta name="description" content="Completa tu compra de forma segura" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Formulario principal */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  Finalizar Compra
                </h1>

                {/* Indicador de estado CORS */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                    <div className="flex items-center">
                      <div className="text-green-600 text-lg mr-2">✓</div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Sistema optimizado</p>
                        <p className="text-sm text-green-700">Interceptor CORS activo</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje para usuarios no autenticados */}
                {!isAuthenticated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <div className="text-blue-600 text-xl mr-3">💡</div>
                      <div>
                        <h3 className="font-medium text-blue-900">¿Ya tienes cuenta?</h3>
                        <p className="text-blue-700 text-sm">
                          <button 
                            onClick={() => router.push('/login?redirect=/checkout')}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Inicia sesión
                          </button> para usar tus direcciones guardadas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form className="space-y-6">
                  
                  {/* Información personal */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          value={customerData.name}
                          onChange={(e) => setCustomerData(prev => ({...prev, name: e.target.value}))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Juan Pérez"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={customerData.email}
                          onChange={(e) => setCustomerData(prev => ({...prev, email: e.target.value}))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="juan@ejemplo.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={customerData.phone}
                          onChange={(e) => setCustomerData(prev => ({...prev, phone: e.target.value}))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+57 300 123 4567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Documento *
                        </label>
                        <input
                          type="text"
                          value={customerData.document}
                          onChange={(e) => setCustomerData(prev => ({...prev, document: e.target.value}))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="12345678"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dirección de envío */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Dirección de Envío
                    </h3>

                    {/* Direcciones guardadas para usuarios autenticados */}
                    {isAuthenticated && savedAddresses.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Usar dirección guardada
                        </label>
                        <select
                          value={selectedSavedAddress}
                          onChange={(e) => handleSavedAddressChange(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="new">Usar nueva dirección</option>
                          {savedAddresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.name} - {address.address}, {address.city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Formulario de dirección */}
                    {(useNewAddress || !isAuthenticated) && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dirección completa *
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.address}
                            onChange={(e) => setShippingAddress(prev => ({...prev, address: e.target.value}))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Calle 123 #45-67, Apartamento 123"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ciudad *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.city}
                              onChange={(e) => setShippingAddress(prev => ({...prev, city: e.target.value}))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Bogotá"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Departamento
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.state}
                              onChange={(e) => setShippingAddress(prev => ({...prev, state: e.target.value}))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Cundinamarca"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Opción para guardar dirección */}
                    {isAuthenticated && useNewAddress && (
                      <div className="mt-4">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm text-gray-600">Guardar esta dirección para futuros pedidos</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas del pedido (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Instrucciones especiales para la entrega..."
                    />
                  </div>

                  {/* Métodos de pago */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Método de Pago
                    </h3>
                    
                    <div className="space-y-3">
                      {/* ePayco */}
                      <div
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPaymentMethod === 'epayco'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPaymentMethod('epayco')}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="payment_method"
                            value="epayco"
                            checked={selectedPaymentMethod === 'epayco'}
                            onChange={() => setSelectedPaymentMethod('epayco')}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="text-2xl mr-3">💳</span>
                              <label className="font-medium cursor-pointer">
                                Pago en línea con ePayco
                              </label>
                              {epaycoLoaded && (
                                <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                  ✓ Listo
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 ml-11">
                              Tarjeta de crédito, débito, PSE o efectivo
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Transferencia */}
                      <div
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPaymentMethod === 'bank_transfer'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPaymentMethod('bank_transfer')}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="payment_method"
                            value="bank_transfer"
                            checked={selectedPaymentMethod === 'bank_transfer'}
                            onChange={() => setSelectedPaymentMethod('bank_transfer')}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="text-2xl mr-3">🏦</span>
                              <label className="font-medium cursor-pointer">
                                Transferencia bancaria
                              </label>
                            </div>
                            <p className="text-sm text-gray-600 ml-11">
                              Pago manual por transferencia
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => router.push('/carrito')}
                      className="text-gray-600 hover:text-gray-800 flex items-center"
                    >
                      ← Volver al carrito
                    </button>
                    
                    <div className="space-x-4">
  {selectedPaymentMethod === 'epayco' && (
    <button
      type="button"
      onClick={handleEpaycoPayment}
      disabled={loading || !epaycoLoaded}
      className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Procesando...
        </>
      ) : (
        'Pagar con ePayco'
      )}
    </button>
  )}

  {selectedPaymentMethod === 'bank_transfer' && (
                        <button
                          type="button"
                          onClick={handleBankTransfer}
                          disabled={loading}
                          className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Procesando...
                            </>
                          ) : (
                            'Continuar con Transferencia'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>  


            {/* Sidebar con resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Resumen del pedido
                </h2>

                {/* Usuario autenticado info */}
                {isAuthenticated && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                    <div className="flex items-center">
                      <div className="text-green-600 text-lg mr-2">✓</div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Sesión iniciada como:</p>
                        <p className="text-sm text-green-700">{user?.name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Productos */}
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => {
                    const price = item.sale_price || item.price;
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-contain rounded-md"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </h4>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-gray-600">
                              Cantidad: {item.quantity}
                            </span>
                            <span className="text-sm font-medium">
                              {formatPrice(price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totales */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>${subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío:</span>
                    <span>${shipping.toLocaleString('es-CO')}</span>
                  </div>
                   <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${total.toLocaleString('es-CO')} COP</span>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">🔒</span>
                      <span>Pago 100% seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">📦</span>
                      <span>Envío en 2-5 días hábiles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Sistema optimizado</span>
                    </div>
                  </div>
                </div>

                {/* Debug info para desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 font-semibold">
                        🔧 Estado del Sistema
                      </summary>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>ePayco Cargado:</span>
                          <span className={epaycoLoaded ? 'text-green-600' : 'text-red-600'}>
                            {epaycoLoaded ? '✅ SÍ' : '❌ NO'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Interceptor CORS:</span>
                          <span className="text-green-600">✅ ACTIVO</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Método Seleccionado:</span>
                          <span>{selectedPaymentMethod || 'Ninguno'}</span>
                        </div>
                      </div>
                    </details>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}