// components/ProductCard.js - CORREGIDO PARA TUS RUTAS REALES
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price?: number;
  featured_image?: string;  // Esta viene de tu API con ruta correcta
  image_alt?: string;
  stock_status: string;
  featured?: number;
  short_description?: string;
  category_name?: string;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  className?: string;
  onView?: () => void;
  priority?: boolean;
  index?: number;
}

export default function ProductCard({ 
  product, 
  viewMode = 'grid', 
  className = '', 
  onView,
  priority = false,
  index = 0
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { addToCart, isInCart, loading, formatPrice } = useCart();
  const productInCart = isInCart(product.id);

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  
  // USAR DIRECTAMENTE TUS IMÁGENES REALES
  const getImageSrc = () => {
    // Tu API ya retorna featured_image con rutas correctas como /optimized/2025/07/
    if (product.featured_image && product.featured_image.trim() !== '') {
      return product.featured_image;
    }
    
    // Solo si realmente no hay imagen, usar placeholder
    return '/images/placeholder-product.jpg';
  };

  const [imageSrc] = useState(getImageSrc());

  const handleImageError = () => {
    if (!imageError) {
      console.warn(`Error cargando imagen del producto ${product.id}: ${imageSrc}`);
      setImageError(true);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock_status !== 'in_stock') return;
    
    try {
      await addToCart(product.id, 1);
      
      // Analytics tracking
      if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.trackAddToCart({
          id: product.id,
          name: product.name,
          price: product.sale_price || product.price,
          category: product.category_name || 'Productos'
        }, 1);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleProductClick = () => {
    if (onView) onView();
    
    // Analytics tracking
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackViewItem({
        id: product.id,
        name: product.name,
        price: product.sale_price || product.price,
        category: product.category_name || 'Productos'
      });
    }
  };

  // Vista en cuadrícula
  if (viewMode === 'grid') {
    return (
      <motion.div 
        className={`group ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300 h-full">
          
          {/* IMAGEN CON TUS RUTAS REALES */}
          <Link href={`/producto/${product.slug}`} onClick={handleProductClick}>
            <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              
              {/* Skeleton loader mientras carga */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                </div>
              )}
              
              {/* Error placeholder - solo si realmente no hay imagen */}
              {imageError && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-600 text-center px-2">{product.name}</span>
                  <span className="text-xs text-gray-400 mt-1">Imagen no disponible</span>
                </div>
              )}
              
              {/* Imagen real usando TUS rutas existentes */}
              {!imageError && (
                <Image
                  src={imageSrc}
                  alt={product.image_alt || product.name}
                  fill
                  className={`object-contain transition-all duration-500 p-3 ${
                    imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  } group-hover:scale-105`}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  priority={priority || index < 4}
                  quality={index < 4 ? 90 : 80}
                  onLoad={() => setImageLoaded(true)}
                  onError={handleImageError}
                />
              )}
              
              {/* Badges mejorados */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                    OFERTA
                  </span>
                )}
                {product.featured === 1 && (
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                    ⭐ DESTACADO
                  </span>
                )}
                {productInCart && (
                  <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                    ✓ EN CARRITO
                  </span>
                )}
              </div>

              {/* Indicador de stock */}
              <div className="absolute bottom-3 right-3">
                <div className={`w-3 h-3 rounded-full shadow-lg ${
                  product.stock_status === 'in_stock' 
                    ? 'bg-green-400' 
                    : 'bg-red-400'
                }`}></div>
              </div>
            </div>
          </Link>
          
          {/* CONTENIDO */}
          <div className="p-4">
            <Link href={`/producto/${product.slug}`} onClick={handleProductClick}>
              <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors text-sm leading-tight min-h-[2.5rem]">
                {product.name}
              </h3>
            </Link>

            {/* Descripción corta si existe */}
            {product.short_description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* PRECIO MEJORADO */}
            <div className="mb-4">
              {hasDiscount ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.sale_price || 0)}
                    </span>
                    <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded font-medium">
                      -{Math.round(((product.price - (product.sale_price || 0)) / product.price) * 100)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </div>
                </div>
              ) : (
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price)}
                </div>
              )}
            </div>

            {/* BOTÓN MEJORADO */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock_status === 'out_of_stock' || loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 transform ${
                product.stock_status === 'out_of_stock'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : productInCart
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Agregando...</span>
                </div>
              ) : product.stock_status === 'out_of_stock' ? (
                'Agotado'
              ) : productInCart ? (
                '✓ En carrito'
              ) : (
                'Agregar al Carrito'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Vista en lista (simplificada)
  return (
    <motion.div 
      className={`group ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-300">
        <div className="flex">
          <div className="w-32 flex-shrink-0">
            <Link href={`/producto/${product.slug}`} onClick={handleProductClick}>
              <div className="relative w-full h-32 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                {!imageError ? (
                  <Image
                    src={imageSrc}
                    alt={product.image_alt || product.name}
                    fill
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                    sizes="128px"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </Link>
          </div>
          
          <div className="flex-1 p-4">
            <div className="flex justify-between h-full">
              <div className="flex-1 pr-4">
                <Link href={`/producto/${product.slug}`} onClick={handleProductClick}>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                {product.short_description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {product.short_description}
                  </p>
                )}
                
                <div className="flex gap-2">
                  {hasDiscount && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-medium">
                      OFERTA
                    </span>
                  )}
                  {product.featured === 1 && (
                    <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded font-medium">
                      DESTACADO
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right flex flex-col justify-between">
                <div className="mb-4">
                  {hasDiscount ? (
                    <>
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(product.sale_price || 0)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(product.price)}
                      </div>
                    </>
                  ) : (
                    <div className="text-xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_status === 'out_of_stock' || loading}
                  className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                    product.stock_status === 'out_of_stock'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : productInCart
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {loading ? '...' : 
                   product.stock_status === 'out_of_stock' ? 'Agotado' : 
                   productInCart ? '✓' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}