// lib/seoUtils.js - VERSION OPTIMIZADA CON MEJORAS
import { query } from './database';

// MANTENER - Ya esta perfecto
export const generateMetaTitle = (product, category = null) => {
  if (product.meta_title && product.meta_title.trim() !== '') {
    return product.meta_title;
  }
  
  const parts = [product.name];
  
  if (category) {
    parts.push(category.name);
  }
  
  parts.push('Judaica Breslov Colombia');
  
  const title = parts.join(' | ');
  
  if (title.length > 60) {
    return `${product.name} - Judaica Breslov`;
  }
  
  return title;
};

// MANTENER - Ya esta optimizado
export const generateMetaDescription = (product, category = null) => {
  if (product.meta_description && product.meta_description.trim() !== '') {
    return product.meta_description;
  }
  
  let description = `Compra ${product.name} `;
  
  if (category) {
    description += `en la categoria ${category.name} `;
  }
  
  if (product.sale_price || product.price) {
    const price = product.sale_price || product.price;
    description += `por $${new Intl.NumberFormat('es-CO').format(price)} `;
  }
  
  if (product.short_description) {
    const shortDesc = product.short_description.replace(/<[^>]*>/g, '').trim();
    if (shortDesc.length > 0) {
      description += `- ${shortDesc.substring(0, 100)} `;
    }
  }
  
  description += 'Envio gratis a toda Colombia. Compra ahora en Judaica Breslov!';
  
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
};

// MEJORADO - Schema de productos mas completo
export const generateProductStructuredData = (product, category = null, images = []) => {
  const baseUrl = 'https://www.judaicabreslovcolombia.com';
  const currentPrice = product.sale_price || product.price;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.short_description || product.description?.replace(/<[^>]*>/g, '').substring(0, 200),
    "sku": product.sku,
    "url": generateCanonicalUrl('product', product.slug, baseUrl),
    
    // AGREGADO: Campos adicionales importantes
    "productID": product.id,
    "mpn": product.sku, // Manufacturer Part Number
    "identifier_exists": "yes"
  };
  
  // MEJORADO: Imagenes con mas detalle
  if (images && images.length > 0) {
    structuredData.image = images.map(img => ({
      "@type": "ImageObject",
      "url": img.image_url,
      "description": img.alt_text || product.name
    }));
  }
  
  // AGREGADO: Peso y dimensiones si existen
  if (product.weight) {
    structuredData.weight = {
      "@type": "QuantitativeValue",
      "value": product.weight,
      "unitText": "kg"
    };
  }
  
  if (product.dimensions) {
    structuredData.size = product.dimensions;
  }
  
  // Categoria
  if (category) {
    structuredData.category = category.name;
  }
  
  // MEJORADO: Oferta mas completa
  structuredData.offers = {
    "@type": "Offer",
    "price": currentPrice,
    "priceCurrency": "COP",
    "availability": product.stock_status === 'in_stock' 
      ? "https://schema.org/InStock" 
      : "https://schema.org/OutOfStock",
    "url": generateCanonicalUrl('product', product.slug, baseUrl),
    
    // CORREGIDO: Informacion de entrega simplificada
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0",
        "currency": "COP"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 3,
          "unitCode": "DAY"
        },
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 1,
          "unitCode": "DAY"
        }
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "CO"
      }
    },
    
    // AGREGADO: Condicion del producto
    "itemCondition": "https://schema.org/NewCondition",
    
    // CORREGIDO: Politica de devolucion simplificada
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 30,
      "returnMethod": "https://schema.org/ReturnByMail",
      "applicableCountry": "CO",
      "returnFees": "https://schema.org/FreeReturn"
    }
  };
  
  // Marca mejorada
  structuredData.brand = {
    "@type": "Brand",
    "name": "Judaica Breslov Colombia",
    "url": baseUrl
  };
  
  // Seller mejorado
  structuredData.offers.seller = {
    "@type": "Organization",
    "name": "Judaica Breslov Colombia",
    "url": baseUrl,
    "telephone": "+57-300-929-1156"
  };
  
  // AGREGADO: Si hay descuento, mostrar precio anterior
  if (product.sale_price && product.price > product.sale_price) {
    structuredData.offers.priceSpecification = {
      "@type": "UnitPriceSpecification",
      "price": product.sale_price,
      "priceCurrency": "COP",
      "referencePrice": {
        "@type": "UnitPriceSpecification", 
        "price": product.price,
        "priceCurrency": "COP"
      }
    };
  }
  
  return structuredData;
};

// MEJORADO: Schema de organizacion mas completo
export const generateOrganizationStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "Store"],
    "name": "Judaica Breslov Colombia", 
    "alternateName": ["Judaica Breslov", "Breslov Colombia"],
    "description": "Tienda y libreria judaica online en Colombia. Productos judios autenticos con envio a todo el pais.",
    "url": "https://www.judaicabreslovcolombia.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.judaicabreslovcolombia.com/logo-judaica-breslov.png",
      "width": 600,
      "height": 200
    },
    
    // AGREGADO: Mas informacion de contacto
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+57-300-929-1156",
        "contactType": "customer service",
        "availableLanguage": ["Spanish"],
        "areaServed": "CO",
        "hoursAvailable": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "09:00",
          "closes": "18:00"
        }
      },
      {
        "@type": "ContactPoint", 
        "contactType": "sales",
        "url": "https://wa.me/573009291156",
        "availableLanguage": ["Spanish"]
      }
    ],
    
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CO",
      "addressLocality": "Bogota",
      "addressRegion": "Cundinamarca"
    },
    
    // AGREGADO: Informacion adicional
    "foundingDate": "2015",
    "currenciesAccepted": "COP",
    "paymentAccepted": ["Credit Card", "Debit Card", "Cash", "Bank Transfer"],
    "priceRange": "$20,000 - $700,000",
    
    "sameAs": [
      "https://www.facebook.com/judaicabreslovcolombia",
      "https://www.instagram.com/judaicabreslovcolombia", 
      "https://wa.me/573009291156"
    ],
    
    // AGREGADO: Area de servicio
    "areaServed": {
      "@type": "Country",
      "name": "Colombia"
    },
    
    // AGREGADO: Categorias de productos
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Productos Judaicos",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Libros Judaicos",
          "itemListElement": []
        },
        {
          "@type": "OfferCatalog", 
          "name": "Articulos Religiosos",
          "itemListElement": []
        },
        {
          "@type": "OfferCatalog",
          "name": "Tefilin y Mezuzot",
          "itemListElement": []
        }
      ]
    }
  };
};

// MEJORADO: Keywords mas especificos por categoria
export const generateKeywords = (product, category = null) => {
  const keywords = [product.name.toLowerCase()];
  
  if (category) {
    keywords.push(category.name.toLowerCase());
  }
  
  const baseKeywords = [
    'judaica colombia',
    'productos judios',
    'judaica bogota', 
    'breslov colombia',
    'libros judaicos',
    'articulos religiosos judios',
    'tienda judaica online',
    'judaica breslov',
    'productos kosher colombia'
  ];
  
  keywords.push(...baseKeywords);
  
  // MEJORADO: Keywords mas especificos
  if (category) {
    switch (category.slug) {
      case 'tefilin':
        keywords.push('tefilin kosher', 'tefilin bogota', 'comprar tefilin', 'tefilin breslov', 'tefilin colombia');
        break;
      case 'mezuza':
        keywords.push('mezuza kosher', 'mezuza con pergamino', 'mezuza judaica', 'klaf mezuza', 'mezuza israel');
        break;
      case 'talit-amp-tzittzit':
        keywords.push('talit gadol', 'talit katan', 'tzitzit', 'talit kosher', 'talit breslov', 'tzitzit kosher');
        break;
      case 'breslov':
        keywords.push('rabi najman', 'breslov libros', 'rabino nachman', 'breslov ensenanzas', 'libros rabi nachman');
        break;
      case 'vinos-kosher':
        keywords.push('vino kosher colombia', 'vino kiddush', 'vino shabat', 'vino kosher israel');
        break;
      case 'libros':
        keywords.push('libros judaicos espanol', 'libros judios', 'literatura judaica', 'tora espanol');
        break;
      case 'menorah':
        keywords.push('menora judaica', 'candelabro judio', 'menora plata', 'menora bronce');
        break;
      case 'shofar':
        keywords.push('shofar kosher', 'cuerno shofar', 'shofar israel', 'shofar original');
        break;
    }
  }
  
  return keywords.join(', ');
};

// MANTENER - Ya estan perfectas
export const generateCategoryMetaTitle = (category) => {
  if (category.meta_title && category.meta_title.trim() !== '') {
    return category.meta_title;
  }
  
  return `${category.name} - Productos Judaicos | Judaica Breslov Colombia`;
};

export const generateCategoryMetaDescription = (category, productCount = 0) => {
  if (category.meta_description && category.meta_description.trim() !== '') {
    return category.meta_description;
  }
  
  let description = `Explora nuestra coleccion de ${category.name.toLowerCase()} `;
  
  if (productCount > 0) {
    description += `con ${productCount} productos disponibles `;
  }
  
  description += 'en Judaica Breslov Colombia. Productos judaicos autenticos con envio gratis a todo el pais.';
  
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
};

export const generateCanonicalUrl = (type, slug, baseUrl = 'https://www.judaicabreslovcolombia.com') => {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
  
  switch (type) {
    case 'product':
      return `${baseUrl}/productos/${cleanSlug}`;
    case 'category':
      return `${baseUrl}/categorias/${cleanSlug}`;
    case 'post':
      return `${baseUrl}/blog/${cleanSlug}`;
    case 'page':
      return `${baseUrl}/${cleanSlug}`;
    default:
      return `${baseUrl}/${cleanSlug}`;
  }
};

export const generateBreadcrumbs = (items, baseUrl = 'https://www.judaicabreslovcolombia.com') => {
  return {
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url ? (item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`) : undefined
    }))
  };
};

export const generateCategoryStructuredData = (category, products = []) => {
  const baseUrl = 'https://www.judaicabreslovcolombia.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.name,
    "description": category.description || generateCategoryMetaDescription(category, products.length),
    "url": generateCanonicalUrl('category', category.slug, baseUrl),
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": products.length,
      "itemListElement": products.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "description": product.short_description,
          "image": product.featured_image,
          "url": generateCanonicalUrl('product', product.slug, baseUrl),
          "offers": {
            "@type": "Offer",
            "priceCurrency": "COP",
            "price": product.sale_price || product.price,
            "availability": product.stock_status === 'in_stock' ? 
              "https://schema.org/InStock" : 
              "https://schema.org/OutOfStock"
          }
        }
      }))
    }
  };
};

export const cleanMetaContent = (content, maxLength = 160) => {
  if (!content) return '';
  
  let cleaned = content.replace(/<[^>]*>/g, '');
  
  cleaned = cleaned.replace(/[""'']/g, '"');
  cleaned = cleaned.replace(/[——]/g, '-');
  
  cleaned = cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength - 3) + '...';
  }
  
  return cleaned.trim();
};

export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[aaaaaa]/g, 'a')
    .replace(/[eeee]/g, 'e') 
    .replace(/[iiii]/g, 'i')
    .replace(/[ooooo]/g, 'o')
    .replace(/[uuuu]/g, 'u')
    .replace(/n/g, 'n')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
};