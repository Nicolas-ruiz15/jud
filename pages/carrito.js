// pages/carrito.js - OPTIMIZADA PARA TU ESTRUCTURA
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function CarritoPage() {
  const { 
    cart, 
    loading, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    formatPrice,
    FREE_SHIPPING_THRESHOLD 
  } = useCart();

  const [updatingItems, setUpdatingItems] = useState(new Set());

  const handleQuantityChange = async (itemId, newQuantity, maxStock = null) => {
    if (newQuantity < 1) {
      return handleRemoveItem(itemId);
    }

    if (maxStock && newQuantity > maxStock) {
      toast.error(`Solo hay ${maxStock} unidades disponibles`);
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await updateCartItem(itemId, newQuantity);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await removeFromCart(itemId);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      await clearCart();
    }
  };

  const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cart.summary.subtotal);

  if (loading && cart.items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Cargando carrito...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Carrito de Compras - Judaica Breslov Colombia</title>
        <meta name="description" content="Revisa los productos en tu carrito de compras. Procede al checkout de forma segura." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          
          {/* Header del carrito */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Carrito de Compras
                </h1>
                <p className="text-gray-600">
                  {cart.items.length === 0 
                    ? 'Tu carrito está vacío' 
                    : `${cart.summary.total_items} producto${cart.summary.total_items !== 1 ? 's' : ''} en tu carrito`
                  }
                </p>
              </div>
              
              {cart.items.length > 0 && (
                <div className="flex gap-4 mt-4 sm:mt-0">
                  <button
                    onClick={handleClearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                    disabled={loading}
                  >
                    Vaciar carrito
                  </button>
                  <Link
                    href="/producto"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    Seguir comprando
                  </Link>
                </div>
              )}
            </div>
          </div>

          {cart.items.length === 0 ? (
            // Carrito vacío
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Tu carrito está vacío
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Explora nuestros productos judaicos y encuentra lo que necesitas para tu hogar.
              </p>
              <Link
                href="/producto"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Explorar productos
              </Link>
            </div>
          ) : (
            // Carrito con productos
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Lista de productos */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence>
                  {cart.items.map((item) => {
                    const isUpdating = updatingItems.has(item.id);
                    const price = item.sale_price || item.price;
                    const originalPrice = item.sale_price ? item.price : null;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-lg shadow-sm p-6"
                      >
                        <div className="flex flex-col sm:flex-row gap-4">
                          
                          {/* Imagen del producto */}
                          <div className="w-24 h-24 flex-shrink-0">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.alt_text || item.name}
                                width={96}
                                height={96}
                                className="w-full h-full object-contain bg-gray-50 rounded-md"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Información del producto */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0 pr-4">
                                <Link
                                  href={`/producto/${item.slug}`}
                                  className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                                >
                                  {item.name}
                                </Link>
                                
                                {/* Precios */}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xl font-bold text-gray-900">
                                    {formatPrice(price)}
                                  </span>
                                  {originalPrice && (
                                    <span className="text-sm text-gray-500 line-through">
                                      {formatPrice(originalPrice)}
                                    </span>
                                  )}
                                </div>

                                {/* Stock status */}
                                {item.manage_stock && (
                                  <div className="mt-2">
                                    {item.stock_status === 'in_stock' ? (
                                      <span className="text-sm text-green-600">
                                        {item.stock_quantity} disponibles
                                      </span>
                                    ) : (
                                      <span className="text-sm text-red-600">
                                        Sin stock
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Eliminar */}
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isUpdating}
                                className="text-gray-400 hover:text-red-500 p-2 transition-colors disabled:opacity-50"
                                aria-label="Eliminar producto"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            {/* Controles de cantidad */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  disabled={isUpdating || item.quantity <= 1}
                                  className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                
                                <div className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                                  {isUpdating ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                                  ) : (
                                    <span className="font-medium">{item.quantity}</span>
                                  )}
                                </div>
                                
                                <button
                                  onClick={() => handleQuantityChange(
                                    item.id, 
                                    item.quantity + 1, 
                                    item.manage_stock ? item.stock_quantity : null
                                  )}
                                  disabled={isUpdating || (item.manage_stock && item.quantity >= item.stock_quantity)}
                                  className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              </div>

                              {/* Subtotal del item */}
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {formatPrice(price * item.quantity)}
                                </div>
                                {originalPrice && (
                                  <div className="text-sm text-gray-500 line-through">
                                    {formatPrice(originalPrice * item.quantity)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Resumen del carrito */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Resumen del pedido
                  </h2>

                  {/* Envío gratis banner */}
                  {!cart.summary.has_free_shipping && amountForFreeShipping > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-sm font-medium text-blue-800">
                          ¡Envío gratis disponible!
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Agrega {formatPrice(amountForFreeShipping)} más para obtener envío gratis
                      </p>
                      <div className="mt-3 bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, (cart.summary.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Desglose de precios */}
                  <div className="space-y-4">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal ({cart.summary.total_items} productos)</span>
                      <span>{formatPrice(cart.summary.subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-gray-700">
                      <span className="flex items-center gap-1">
                        Envío
                        {cart.summary.has_free_shipping && (
                          <span className="text-green-600 text-sm">(Gratis)</span>
                        )}
                      </span>
                      <span className={cart.summary.has_free_shipping ? 'text-green-600 line-through' : ''}>
                        {formatPrice(cart.summary.shipping)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-xl font-bold text-gray-900">
                        <span>Total</span>
                        <span>{formatPrice(cart.summary.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-8 space-y-4">
                    <Link
                      href="/checkout"
                      className="w-full bg-blue-600 text-white text-center py-4 px-6 rounded-md font-semibold hover:bg-blue-700 transition-colors block"
                    >
                      Proceder al checkout
                    </Link>
                    
                    <Link
                      href="/producto"
                      className="w-full bg-gray-100 text-gray-800 text-center py-3 px-6 rounded-md font-medium hover:bg-gray-200 transition-colors block"
                    >
                      Seguir comprando
                    </Link>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Pago 100% seguro</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Productos auténticos certificados</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Soporte especializado</span>
                      </div>
                    </div>
                  </div>

                  {/* Métodos de pago */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Métodos de pago aceptados
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      <div className="bg-gray-100 rounded px-2 py-1">
                        <span className="text-xs font-medium text-blue-600">VISA</span>
                      </div>
                      <div className="bg-gray-100 rounded px-2 py-1">
                        <span className="text-xs font-medium text-orange-600">MC</span>
                      </div>
                      <div className="bg-gray-100 rounded px-2 py-1">
                        <span className="text-xs font-medium text-blue-800">PSE</span>
                      </div>
                      <div className="bg-gray-100 rounded px-2 py-1">
                        <span className="text-xs font-medium text-red-600">EFECTY</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ShoppingCart",
            "name": "Carrito de Compras - Judaica Breslov Colombia",
            "url": "https://judaicabreslovcolombia.com/carrito",
            "totalPrice": cart.summary.total,
            "priceCurrency": "COP",
            "numberOfItems": cart.summary.total_items
          })
        }}
      />
    </Layout>
  );
}