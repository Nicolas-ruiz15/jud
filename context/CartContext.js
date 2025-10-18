// context/CartContext.js - CON ANALYTICS INTEGRADO
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useEcommerceAnalytics } from '../hooks/useEcommerceAnalytics';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    summary: {
      total_items: 0,
      subtotal: 0,
      shipping: 0,
      total: 0,
      has_free_shipping: false
    }
  });
  const [loading, setLoading] = useState(false);

  // Configuración desde tu .env
  const FREE_SHIPPING_THRESHOLD = 250000; // Tu FREE_SHIPPING_THRESHOLD
  const SHIPPING_COST = 18000; // Tu SHIPPING_COST

  useEffect(() => {
    fetchCart();
  }, []);

  // Calcular resumen del carrito optimizado para tu BD
  const calculateCartSummary = (items) => {
    const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Usar sale_price si existe, sino price (como en tu BD)
    const subtotal = items.reduce((sum, item) => {
      const price = item.sale_price || item.price;
      return sum + (price * item.quantity);
    }, 0);

    const has_free_shipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shipping = has_free_shipping ? 0 : SHIPPING_COST;
    const total = subtotal + shipping;

    return {
      total_items,
      subtotal,
      shipping,
      total,
      has_free_shipping
    };
  };

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include' // Para manejar cookies de session_id
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Calcular resumen con los items obtenidos
          const summary = calculateCartSummary(data.data);
          setCart({
            items: data.data,
            summary
          });
        }
      }
    } catch (error) {
      console.error('Error obteniendo carrito:', error);
    }
  };

  const addToCart = async (productId, quantity = 1, productData = null) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          product_id: productId, // Usar product_id como en tu API
          quantity 
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchCart(); // Refrescar carrito completo

        // 📊 TRACKING ANALYTICS - Add to Cart
        if (typeof window !== 'undefined' && window.analytics) {
          // Usar productData si se proporciona, sino crear objeto básico
          const product = productData || {
            id: productId,
            name: data.product_name || 'Producto',
            category: data.product_category || 'General',
            price: data.product_price || 0,
            sku: data.product_sku || ''
          };

          window.analytics.track('add_to_cart', {
            category: 'ecommerce',
            action: 'add_to_cart',
            label: `${product.name} x${quantity}`,
            value: product.price * quantity,
            metadata: {
              product_id: product.id,
              product_name: product.name,
              product_category: product.category,
              product_price: product.price,
              product_sku: product.sku,
              quantity: quantity,
              total_value: product.price * quantity
            }
          });

          // También trackear como conversión
          window.analytics.trackConversion('add_to_cart', product.price * quantity, {
            product_id: product.id,
            quantity: quantity
          });
        }

        toast.success(`Producto agregado al carrito`);
        return { success: true };
      } else {
        toast.error(data.message || 'Error agregando al carrito');
        return { success: false, message: data.message };
      }
    } catch (error) {
      toast.error('Error de conexión');
      console.error('Error adding to cart:', error);
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId, quantity, productData = null) => {
    if (quantity <= 0) {
      return removeFromCart(itemId, productData);
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          item_id: itemId, // Usar item_id como en tu API
          quantity 
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchCart();

        // 📊 TRACKING ANALYTICS - Update Cart Item
        if (typeof window !== 'undefined' && window.analytics && productData) {
          window.analytics.track('update_cart_item', {
            category: 'ecommerce',
            action: 'update_quantity',
            label: `${productData.name} -> ${quantity}`,
            value: productData.price * quantity,
            metadata: {
              product_id: productData.id,
              new_quantity: quantity,
              item_id: itemId
            }
          });
        }

        toast.success('Cantidad actualizada');
        return { success: true };
      } else {
        toast.error(data.message || 'Error actualizando carrito');
        return { success: false, message: data.message };
      }
    } catch (error) {
      toast.error('Error actualizando carrito');
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId, productData = null) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          item_id: itemId // Usar item_id como en tu API
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchCart();

        // 📊 TRACKING ANALYTICS - Remove from Cart
        if (typeof window !== 'undefined' && window.analytics && productData) {
          window.analytics.track('remove_from_cart', {
            category: 'ecommerce',
            action: 'remove_from_cart',
            label: productData.name,
            value: productData.price * (productData.quantity || 1),
            metadata: {
              product_id: productData.id,
              product_name: productData.name,
              quantity: productData.quantity || 1,
              item_id: itemId
            }
          });
        }

        toast.success('Producto eliminado del carrito');
        return { success: true };
      } else {
        toast.error(data.message || 'Error eliminando producto');
        return { success: false, message: data.message };
      }
    } catch (error) {
      toast.error('Error eliminando del carrito');
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      // 📊 TRACKING ANALYTICS - Track Cart Abandonment antes de limpiar
      if (typeof window !== 'undefined' && window.analytics && cart.items.length > 0) {
        window.analytics.track('cart_abandonment', {
          category: 'ecommerce',
          action: 'cart_cleared',
          label: 'manual_clear',
          value: cart.summary.total,
          metadata: {
            abandonment_stage: 'manual_clear',
            cart_items: cart.items.length,
            cart_value: cart.summary.total,
            items: cart.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price
            }))
          }
        });
      }

      // Eliminar todos los items uno por uno
      const promises = cart.items.map(item => 
        fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ item_id: item.id })
        })
      );
      
      await Promise.all(promises);
      
      setCart({
        items: [],
        summary: {
          total_items: 0,
          subtotal: 0,
          shipping: 0,
          total: 0,
          has_free_shipping: false
        }
      });
      
      toast.success('Carrito limpiado');
      return { success: true };
    } catch (error) {
      toast.error('Error limpiando carrito');
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  };

  // 📊 NUEVO: Método para trackear inicio de checkout
  const beginCheckout = () => {
    if (typeof window !== 'undefined' && window.analytics && cart.items.length > 0) {
      window.analytics.track('begin_checkout', {
        category: 'ecommerce',
        action: 'begin_checkout',
        label: `${cart.items.length} productos`,
        value: cart.summary.total,
        metadata: {
          cart_items: cart.items.map(item => ({
            product_id: item.product_id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total_items: cart.summary.total_items,
          total_value: cart.summary.total,
          subtotal: cart.summary.subtotal,
          shipping: cart.summary.shipping
        }
      });

      // Conversión importante
      window.analytics.trackConversion('begin_checkout', cart.summary.total, {
        cart_size: cart.items.length,
        total_items: cart.summary.total_items
      });
    }
  };

  // Funciones de utilidad
  const getCartItemsCount = () => {
    return cart.summary.total_items;
  };

  const isInCart = (productId) => {
    return cart.items.some(item => item.product_id === productId);
  };

  const getCartItem = (productId) => {
    return cart.items.find(item => item.product_id === productId);
  };

  const getCartItemById = (itemId) => {
    return cart.items.find(item => item.id === itemId);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
    beginCheckout, // 📊 NUEVO método para analytics
    getCartItemsCount,
    isInCart,
    getCartItem,
    getCartItemById,
    formatPrice,
    // Configuración
    FREE_SHIPPING_THRESHOLD,
    SHIPPING_COST
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};