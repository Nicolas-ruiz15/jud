// hooks/usePurchaseTracking.js - Hook para trackear compras exitosas
import { useEffect } from 'react';
import { useEcommerceAnalytics } from './useEcommerceAnalytics';

export const usePurchaseTracking = (orderData) => {
  const { trackPurchase, isReady } = useEcommerceAnalytics();

  useEffect(() => {
    if (orderData && isReady) {
      // Estructura de datos esperada por tu BD
      const purchaseData = {
        orderId: orderData.id,
        orderNumber: orderData.order_number || orderData.id,
        items: orderData.items || orderData.order_items || [],
        subtotal: orderData.subtotal || orderData.total_amount,
        shipping: orderData.shipping_cost || orderData.shipping || 0,
        tax: orderData.tax || 0,
        total: orderData.total_amount || orderData.total,
        paymentMethod: orderData.payment_method || 'unknown',
        userId: orderData.user_id || orderData.customer_id
      };

      console.log('📊 Tracking purchase:', purchaseData);
      trackPurchase(purchaseData);
    }
  }, [orderData, isReady, trackPurchase]);
};

// Ejemplo de uso en página de éxito:
/*
// pages/checkout/success/[orderId].js
import { usePurchaseTracking } from '../../../hooks/usePurchaseTracking';

export default function CheckoutSuccess({ order }) {
  // 📊 Track compra automáticamente
  usePurchaseTracking(order);

  return (
    <div>
      <h1>¡Compra realizada con éxito!</h1>
      <p>Orden: {order.order_number}</p>
      <p>Total: ${order.total_amount.toLocaleString()}</p>
    </div>
  );
}
*/