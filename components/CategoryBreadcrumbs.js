// components/CategoryBreadcrumbs.js
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CategoryBreadcrumbs = ({ 
  category,
  className = "",
  showHome = true,
  showCurrent = true,
  separator = "chevron", // "chevron", "slash", "arrow"
  maxItems = 5,
  collapsible = true
}) => {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (category) {
      buildBreadcrumbs();
    }
  }, [category]);

  const buildBreadcrumbs = async () => {
    setLoading(true);
    try {
      const crumbs = [];
      
      // Agregar inicio si se especifica
      if (showHome) {
        crumbs.push({
          name: 'Inicio',
          href: '/',
          type: 'home'
        });
        
        crumbs.push({
          name: 'Categorías',
          href: '/categorias',
          type: 'categories'
        });
      }

      // Si la categoría tiene jerarquía, construir la cadena
      if (category.hierarchy_path && category.hierarchy_path.length > 0) {
        category.hierarchy_path.forEach((item, index) => {
          // No agregar la categoría actual si showCurrent es false
          if (!showCurrent && index === category.hierarchy_path.length - 1) {
            return;
          }
          
          crumbs.push({
            name: item.name,
            href: `/categorias/${item.slug}`,
            type: 'category',
            id: item.id,
            current: showCurrent && index === category.hierarchy_path.length - 1
          });
        });
      } else {
        // Si no hay jerarquía pero tenemos la categoría actual
        if (showCurrent && category.name) {
          crumbs.push({
            name: category.name,
            href: `/categorias/${category.slug}`,
            type: 'category',
            id: category.id,
            current: true
          });
        }
      }

      // Verificar si necesitamos colapsar
      if (collapsible && crumbs.length > maxItems) {
        setCollapsed(true);
      }

      setBreadcrumbs(crumbs);
    } catch (error) {
      console.error('Error building breadcrumbs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeparatorIcon = () => {
    switch (separator) {
      case 'slash':
        return <span className="text-gray-400 mx-2">/</span>;
      case 'arrow':
        return <span className="text-gray-400 mx-2">→</span>;
      case 'chevron':
      default:
        return (
          <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const renderBreadcrumb = (crumb, index, isLast) => {
    const baseClasses = "transition-colors duration-200";
    const linkClasses = crumb.current 
      ? "text-gray-900 font-medium cursor-default" 
      : "text-gray-600 hover:text-gray-900 hover:underline";

    const content = (
      <span className={`${baseClasses} ${linkClasses} ${crumb.type === 'home' ? 'flex items-center' : ''}`}>
        {crumb.type === 'home' && (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        )}
        <span className="truncate max-w-[150px]" title={crumb.name}>
          {crumb.name}
        </span>
      </span>
    );

    return (
      <li key={`${crumb.type}-${crumb.id || index}`} className="flex items-center">
        {index > 0 && getSeparatorIcon()}
        {crumb.current ? (
          content
        ) : (
          <Link href={crumb.href} className="flex items-center">
            {content}
          </Link>
        )}
      </li>
    );
  };

  const renderCollapsedBreadcrumbs = () => {
    const visibleStart = breadcrumbs.slice(0, 2);
    const visibleEnd = breadcrumbs.slice(-2);
    const hiddenCount = breadcrumbs.length - 4;

    return (
      <>
        {visibleStart.map((crumb, index) => 
          renderBreadcrumb(crumb, index, false)
        )}
        
        <li className="flex items-center">
          {getSeparatorIcon()}
          <button
            onClick={() => setCollapsed(false)}
            className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded transition-colors"
            title={`Mostrar ${hiddenCount} elemento(s) oculto(s)`}
          >
            <span className="text-sm">... ({hiddenCount})</span>
          </button>
        </li>
        
        {visibleEnd.map((crumb, index) => 
          renderBreadcrumb(crumb, index + 2, index === visibleEnd.length - 1)
        )}
      </>
    );
  };

  if (loading) {
    return (
      <nav className={`flex ${className}`} aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="flex items-center">
              {i > 0 && getSeparatorIcon()}
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap">
        {collapsed && collapsible && breadcrumbs.length > maxItems
          ? renderCollapsedBreadcrumbs()
          : breadcrumbs.map((crumb, index) => 
              renderBreadcrumb(crumb, index, index === breadcrumbs.length - 1)
            )
        }
      </ol>
    </nav>
  );
};

// Variante simple para mostrar solo la jerarquía de categorías
export const SimpleCategoryPath = ({ 
  category, 
  separator = " > ",
  className = "text-sm text-gray-600"
}) => {
  if (!category?.hierarchy_path || category.hierarchy_path.length === 0) {
    return category?.name ? (
      <span className={className}>{category.name}</span>
    ) : null;
  }

  return (
    <span className={className}>
      {category.hierarchy_path.map((item, index) => (
        <span key={item.id}>
          {index > 0 && separator}
          {item.name}
        </span>
      ))}
    </span>
  );
};

// Variante para admin con enlaces
export const AdminCategoryBreadcrumbs = ({ 
  category,
  className = "",
  baseUrl = "/admin/categorias"
}) => {
  if (!category) return null;

  const breadcrumbs = [
    { name: 'Categorías', href: baseUrl },
    ...(category.hierarchy_path || []).map(item => ({
      name: item.name,
      href: `${baseUrl}/${item.id}`
    }))
  ];

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-900 font-medium">{crumb.name}</span>
            ) : (
              <Link href={crumb.href} className="text-gray-600 hover:text-gray-900 hover:underline">
                {crumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default CategoryBreadcrumbs;