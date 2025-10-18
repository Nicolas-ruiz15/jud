// hooks/useEcommerceAnalytics.js - VERSION SIMPLIFICADA
import { useAnalytics } from '../components/AnalyticsProvider';
import { useCallback } from 'react';

export const useEcommerceAnalytics = () => {
  const { track, trackConversion, isReady } = useAnalytics();

  // Track vista de producto
  const trackProductView = useCallback((product) => {
    if (!isReady || !product) return;
    
    console.log('📊 Tracking product view:', product.name);

    track('product_view', {
      category: 'ecommerce',
      action: 'view_product',
      label: product.name,
      value: product.price,
      metadata: {
        product_id: product.id,
        product_name: product.name,
        product_category: product.category,
        product_price: product.price,
        product_sku: product.sku,
        product_brand: product.brand || 'Judaica Breslov'
      }
    });
  }, [track, isReady]);

  // Track agregar al carrito
  const trackAddToCart = useCallback((product, quantity = 1) => {
    if (!isReady || !product) return;

    const totalValue = product.price * quantity;
    console.log('📊 Tracking add to cart:', product.name, 'x', quantity);

    track('add_to_cart', {
      category: 'ecommerce',
      action: 'add_to_cart',
      label: `${product.name} x${quantity}`,
      value: totalValue,
      metadata: {
        product_id: product.id,
        product_name: product.name,
        product_category: product.category,
        product_price: product.price,
        product_sku: product.sku,
        quantity: quantity,
        total_value: totalValue
      }
    });

    // También trackear como conversión
    trackConversion('add_to_cart', totalValue, {
      product_id: product.id,
      quantity: quantity
    });
  }, [track, trackConversion, isReady]);

  // Track inicio de checkout
  const trackBeginCheckout = useCallback((cartItems, totalValue) => {
    if (!isReady || !cartItems?.length) return;

    console.log('📊 Tracking begin checkout:', cartItems.length, 'items, total:', totalValue);

    track('begin_checkout', {
      category: 'ecommerce',
      action: 'begin_checkout',
      label: `${cartItems.length} productos`,
      value: totalValue,
      metadata: {
        cart_items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total_value: totalValue
      }
    });

    // Conversión importante
    trackConversion('begin_checkout', totalValue, {
      cart_size: cartItems.length,
      total_items: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    });
  }, [track, trackConversion, isReady]);

  // Track transacción completada
  const trackPurchase = useCallback((orderData) => {
    if (!isReady || !orderData) return;

    console.log('📊 Tracking purchase:', orderData);

    const {
      orderId,
      orderNumber,
      items,
      subtotal,
      shipping = 0,
      tax = 0,
      total,
      paymentMethod,
      userId
    } = orderData;

    // Track evento de compra
    track('purchase', {
      category: 'ecommerce',
      action: 'purchase_completed',
      label: `Orden ${orderNumber}`,
      value: total,
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
        user_id: userId,
        payment_method: paymentMethod,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        })),
        total_items: items.reduce((sum, item) => sum + item.quantity, 0)
      }
    });

    // Conversión de compra (MUY IMPORTANTE)
    trackConversion('purchase', total, {
      order_id: orderId,
      order_number: orderNumber,
      payment_method: paymentMethod,
      items_count: items.length,
      total_items: items.reduce((sum, item) => sum + item.quantity, 0)
    });
  }, [track, trackConversion, isReady]);

  return {
    // Eventos principales de e-commerce
    trackProductView,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    
    // Estado
    isReady,
    
    // Métodos auxiliares
    trackCustomEvent: track,
    trackCustomConversion: trackConversion
  };
};