// components/BlogCard.js - COMPONENTE REUTILIZABLE PARA ARTÍCULOS DEL BLOG
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const BlogCard = ({ 
  post, 
  index = 0, 
  showCategory = true, 
  showExcerpt = true,
  showMeta = true,
  size = 'default', // 'small', 'default', 'large'
  layout = 'vertical' // 'vertical', 'horizontal'
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        delay: index * 0.1 
      }
    }
  };

  // Configuraciones por tamaño
  const sizeConfig = {
    small: {
      imageHeight: 'h-32',
      titleSize: 'text-sm',
      excerptLines: 'line-clamp-2',
      padding: 'p-4'
    },
    default: {
      imageHeight: 'h-48',
      titleSize: 'text-lg',
      excerptLines: 'line-clamp-3',
      padding: 'p-6'
    },
    large: {
      imageHeight: 'h-64',
      titleSize: 'text-xl',
      excerptLines: 'line-clamp-4',
      padding: 'p-8'
    }
  };

  const config = sizeConfig[size];

  if (layout === 'horizontal') {
    return (
      <motion.article
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
      >
        <Link href={`/blog/${post.slug}`}>
          <div className="flex">
            {/* Imagen */}
            {post.featured_image && (
              <div className={`flex-shrink-0 w-48 ${config.imageHeight} overflow-hidden`}>
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  width={192}
                  height={192}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {post.featured && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Destacado
                  </div>
                )}
              </div>
            )}
            
            {/* Contenido */}
            <div className={`flex-1 ${config.padding}`}>
              {/* Categoría y fecha */}
              {showCategory && (showMeta && (post.category_name || post.published_at)) && (
                <div className="flex items-center justify-between mb-3">
                  {post.category_name && (
                    <Link
                      href={`/blog?categoria=${post.category_slug}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${post.category_color || '#2563eb'}20`,
                        color: post.category_color || '#2563eb'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.category_name}
                    </Link>
                  )}
                  {showMeta && post.published_at && (
                    <time className="text-sm text-gray-500">
                      {formatDate(post.published_at)}
                    </time>
                  )}
                </div>
              )}

              {/* Título */}
              <h3 className={`${config.titleSize} font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2`}>
                {post.title}
              </h3>

              {/* Excerpt */}
              {showExcerpt && post.excerpt && (
                <p className={`text-gray-600 mb-4 ${config.excerptLines}`}>
                  {post.excerpt}
                </p>
              )}

              {/* Meta info */}
              {showMeta && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {post.reading_time || 5} min
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {post.views_count || 0}
                    </span>
                  </div>
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Leer más →
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  // Layout vertical (default)
  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
    >
      <Link href={`/blog/${post.slug}`}>
        {/* Imagen */}
        {post.featured_image && (
          <div className={`relative ${config.imageHeight} overflow-hidden`}>
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {post.featured && (
              <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                Destacado
              </div>
            )}
          </div>
        )}
        
        {/* Contenido */}
        <div className={config.padding}>
          {/* Categoría y fecha */}
          {showCategory && (showMeta && (post.category_name || post.published_at)) && (
            <div className="flex items-center justify-between mb-3">
              {post.category_name && (
                <Link
                  href={`/blog?categoria=${post.category_slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${post.category_color || '#2563eb'}20`,
                    color: post.category_color || '#2563eb'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.category_name}
                </Link>
              )}
              {showMeta && post.published_at && (
                <time className="text-sm text-gray-500">
                  {formatDate(post.published_at)}
                </time>
              )}
            </div>
          )}

          {/* Título */}
          <h3 className={`${config.titleSize} font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2`}>
            {post.title}
          </h3>

          {/* Excerpt */}
          {showExcerpt && post.excerpt && (
            <p className={`text-gray-600 mb-4 ${config.excerptLines}`}>
              {post.excerpt}
            </p>
          )}

          {/* Meta info */}
          {showMeta && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {post.reading_time || 5} min
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.views_count || 0}
                </span>
              </div>
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Leer más →
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
};

// Componente para lista de posts relacionados (más compacto)
export const RelatedPostCard = ({ post }) => {
  return (
    <BlogCard 
      post={post}
      showCategory={false}
      showExcerpt={false}
      size="small"
      layout="horizontal"
    />
  );
};

// Componente para posts destacados en sidebar
export const FeaturedPostCard = ({ post }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <div className="flex space-x-3">
        {post.featured_image && (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
            <Image
              src={post.featured_image}
              alt={post.title}
              width={64}
              height={64}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(post.published_at)}
          </p>
        </div>
      </div>
    </Link>
  );
};

// Componente para grid responsivo de posts
export const BlogGrid = ({ posts, columns = 'auto' }) => {
  const getGridClass = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <div className={`grid ${getGridClass()} gap-6`}>
      {posts.map((post, index) => (
        <BlogCard key={post.id} post={post} index={index} />
      ))}
    </div>
  );
};

export default BlogCard;