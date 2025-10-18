import { useState } from 'react';
import { useCart } from '../context/CartContext';

const AddToCartButton = ({ productId, stockStatus }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    if (stockStatus !== 'in_stock') return;
    setIsAdding(true);
    await addToCart(productId, quantity);
    setIsAdding(false);
    // Podrías añadir una notificación aquí
  };

  const isSoldOut = stockStatus !== 'in_stock';

  return (
    <div className="flex items-center space-x-4 mt-6">
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-20 p-3 border border-gray-300 rounded-md text-center"
        min="1"
        disabled={isSoldOut}
      />
      <button
        onClick={handleAddToCart}
        disabled={isSoldOut || isAdding}
        className="flex-1 bg-primary-600 text-white font-bold py-3 px-6 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSoldOut ? 'Agotado' : (isAdding ? 'Añadiendo...' : 'Añadir al Carrito')}
      </button>
    </div>
  );
};

export default AddToCartButton;