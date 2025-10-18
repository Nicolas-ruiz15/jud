// components/CategoryCard.js
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function CategoryCard({ category, onClick }) {
  const productCount = category.product_count || 0;
  
  return (
    <Link href={`/categorias/${category.slug}`} onClick={onClick}>
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 group"
      >
        {/* Imagen de la categoría */}
        <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              width={300}
              height={300}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {/* Icono por defecto basado en el nombre de la categoría */}
              <div className="text-6xl text-blue-400">
                {getCategoryIcon(category.name)}
              </div>
            </div>
          )}
          
          {/* Overlay con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badge con número de productos */}
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
              {productCount} producto{productCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {category.name}
          </h3>
          
          {category.description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {category.description}
            </p>
          )}
          
          {!category.description && (
            <p className="text-gray-500 text-sm italic">
              Explora nuestra colección de {category.name.toLowerCase()}
            </p>
          )}

          {/* CTA */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors">
              Ver productos
            </span>
            <svg 
              className="w-4 h-4 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Función para obtener iconos basados en el nombre de la categoría
function getCategoryIcon(categoryName) {
  const name = categoryName.toLowerCase();
  
  if (name.includes('libro') || name.includes('sidur') || name.includes('texto')) {
    return '📚';
  }
  if (name.includes('mezuza') || name.includes('mezuzot')) {
    return '🏠';
  }
  if (name.includes('tefilin') || name.includes('tefilín')) {
    return '📿';
  }
  if (name.includes('talit') || name.includes('tallit')) {
    return '🧣';
  }
  if (name.includes('kipa') || name.includes('kipot') || name.includes('yarmulke')) {
    return '👒';
  }
  if (name.includes('candelabro') || name.includes('menorah') || name.includes('januka')) {
    return '🕯️';
  }
  if (name.includes('shofar')) {
    return '📯';
  }
  if (name.includes('vino') || name.includes('kidush') || name.includes('copa')) {
    return '🍷';
  }
  if (name.includes('joya') || name.includes('jewelry') || name.includes('collar')) {
    return '💍';
  }
  if (name.includes('arte') || name.includes('decoracion') || name.includes('cuadro')) {
    return '🎨';
  }
  if (name.includes('mujer') || name.includes('femenino')) {
    return '👩';
  }
  if (name.includes('niño') || name.includes('infantil') || name.includes('bebe')) {
    return '👶';
  }
  if (name.includes('ritual') || name.includes('ceremonial')) {
    return '✨';
  }
  
  // Icono por defecto
  return '🔯';
}