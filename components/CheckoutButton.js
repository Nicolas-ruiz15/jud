// components/CheckoutButton.js - Botón de checkout con analytics
import { useCart } from '../context/CartContext';
import { useEcommerceAnalytics } from '../hooks/useEcommerceAnalytics';
import { useRouter } from 'next/router';

const CheckoutButton = ({ className = "" }) => {
  const { cart, beginCheckout } = useCart();
  const { trackBeginCheckout, isReady } = useEcommerceAnalytics();
  const router = useRouter();

  const handleCheckout = () => {
    if (cart.items.length === 0) return;

    // 📊 ANALYTICS: Track begin checkout (método del hook)
    if (isReady) {
      trackBeginCheckout(
        cart.items.map(item => ({
          id: item.product_id,
          name: item.name,
          category: item.category || 'General',
          price: item.price,
          quantity: item.quantity
        })),
        cart.summary.total
      );
    }

    // También usar el método del CartContext (ya incluye tracking interno)
    beginCheckout();

    // Redirigir al checkout
    router.push('/checkout');
  };

  const isDisabled = cart.items.length === 0;

  return (
    <button
      onClick={handleCheckout}
      disabled={isDisabled}
      className={`w-full bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {isDisabled ? 'Carrito Vacío' : 'Proceder al Checkout'}
    </button>
  );
};

export default CheckoutButton;