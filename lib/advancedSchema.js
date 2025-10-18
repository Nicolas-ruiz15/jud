// lib/advancedSchema.js - SCHEMA MARKUP AVANZADO
import { generateCanonicalUrl } from './seoUtils';

// Schema para FAQ (Preguntas Frecuentes)
export const generateFAQSchema = (faqs) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

// Schema para Reviews/Reseñas
export const generateReviewSchema = (product, reviews) => {
  if (!reviews || reviews.length === 0) return null;
  
  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.[0]?.image_url,
    "description": product.short_description,
    "sku": product.sku,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "reviewCount": reviews.length,
      "bestRating": 5,
      "worstRating": 1
    },
    "review": reviews.map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": 5,
        "worstRating": 1
      },
      "author": {
        "@type": "Person",
        "name": review.author_name
      },
      "reviewBody": review.content,
      "datePublished": review.created_at
    }))
  };
};

// Schema para Local Business (Tienda física si la tienes)
export const generateLocalBusinessSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "Judaica Breslov Colombia",
    "description": "Tienda de productos judaicos y libros religiosos en Colombia",
    "url": "https://www.judaicabreslovcolombia.com",
    "telephone": "+57-300-929-1156",
    "email": "contacto@judaicabreslovcolombia.com",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CO",
      "addressLocality": "Bogotá",
      "addressRegion": "Cundinamarca"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "4.7110",
      "longitude": "-74.0721"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "10:00",
        "closes": "14:00"
      }
    ],
    "acceptedPaymentMethod": [
      "http://purl.org/goodrelations/v1#ByBankTransferInAdvance",
      "http://purl.org/goodrelations/v1#ByInvoice",
      "http://purl.org/goodrelations/v1#Cash",
      "http://purl.org/goodrelations/v1#PayPal"
    ],
    "currenciesAccepted": "COP",
    "paymentAccepted": "Efectivo, Tarjeta de Crédito, PSE, Transferencia",
    "priceRange": "$10000-$500000"
  };
};

// Schema para WebSite (Búsqueda interna)
export const generateWebSiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Judaica Breslov Colombia",
    "url": "https://www.judaicabreslovcolombia.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.judaicabreslovcolombia.com/buscar?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
};

// Schema para artículos de blog
export const generateArticleSchema = (article, author = null) => {
  const baseUrl = 'https://www.judaicabreslovcolombia.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt || article.meta_description,
    "image": article.featured_image ? `${baseUrl}${article.featured_image}` : null,
    "datePublished": article.published_at,
    "dateModified": article.updated_at,
    "author": {
      "@type": "Person",
      "name": author?.name || "Equipo Judaica Breslov"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Judaica Breslov Colombia",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo-judaica-breslov.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": generateCanonicalUrl('post', article.slug, baseUrl)
    }
  };
};

// Schema para Ofertas Especiales
export const generateOfferSchema = (product, discount) => {
  const baseUrl = 'https://www.judaicabreslovcolombia.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": `Oferta: ${product.name}`,
    "description": `${discount.percentage}% de descuento en ${product.name}`,
    "price": product.sale_price || product.price,
    "priceCurrency": "COP",
    "priceValidUntil": discount.valid_until,
    "availability": product.stock_status === 'in_stock' ? 
      "https://schema.org/InStock" : 
      "https://schema.org/OutOfStock",
    "url": generateCanonicalUrl('product', product.slug, baseUrl),
    "seller": {
      "@type": "Organization",
      "name": "Judaica Breslov Colombia"
    },
    "itemOffered": {
      "@type": "Product",
      "name": product.name,
      "description": product.short_description,
      "image": product.images?.[0]?.image_url,
      "sku": product.sku
    }
  };
};

// Schema para Eventos (Fiestas judías, clases, etc.)
export const generateEventSchema = (event) => {
  const baseUrl = 'https://www.judaicabreslovcolombia.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.name,
    "description": event.description,
    "startDate": event.start_date,
    "endDate": event.end_date,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": event.is_online ? 
      "https://schema.org/OnlineEventAttendanceMode" : 
      "https://schema.org/OfflineEventAttendanceMode",
    "location": event.is_online ? {
      "@type": "VirtualLocation",
      "url": event.online_url
    } : {
      "@type": "Place",
      "name": event.location_name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Bogotá",
        "addressCountry": "CO"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "Judaica Breslov Colombia",
      "url": baseUrl
    },
    "offers": event.price ? {
      "@type": "Offer",
      "price": event.price,
      "priceCurrency": "COP",
      "availability": "https://schema.org/InStock",
      "url": `${baseUrl}/eventos/${event.slug}`
    } : {
      "@type": "Offer",
      "price": 0,
      "priceCurrency": "COP",
      "availability": "https://schema.org/InStock"
    }
  };
};

// Schema para Courses/Clases (Estudio de Torá, etc.)
export const generateCourseSchema = (course) => {
  const baseUrl = 'https://www.judaicabreslovcolombia.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.name,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "Judaica Breslov Colombia",
      "url": baseUrl
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": course.is_online ? "online" : "in-person",
      "startDate": course.start_date,
      "endDate": course.end_date,
      "instructor": {
        "@type": "Person",
        "name": course.instructor_name
      }
    },
    "offers": {
      "@type": "Offer",
      "price": course.price || 0,
      "priceCurrency": "COP",
      "availability": "https://schema.org/InStock"
    }
  };
};

// Schema para HowTo (Guías paso a paso)
export const generateHowToSchema = (guide) => {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": guide.title,
    "description": guide.description,
    "image": guide.featured_image,
    "totalTime": guide.estimated_time,
    "supply": guide.supplies?.map(supply => ({
      "@type": "HowToSupply",
      "name": supply
    })) || [],
    "tool": guide.tools?.map(tool => ({
      "@type": "HowToTool",
      "name": tool
    })) || [],
    "step": guide.steps?.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.title,
      "text": step.description,
      "image": step.image
    })) || []
  };
};

// Función para combinar múltiples schemas
export const combineSchemas = (...schemas) => {
  const validSchemas = schemas.filter(schema => schema !== null && schema !== undefined);
  
  if (validSchemas.length === 0) return null;
  if (validSchemas.length === 1) return validSchemas[0];
  
  return validSchemas;
};

// Schema para páginas de categoría mejorado
export const generateEnhancedCategorySchema = (category, products, subcategories = []) => {
  const baseUrl = 'https://www.judaicabreslovcolombia.com';
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.name,
    "description": category.description,
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
          "sku": product.sku,
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
  
  // Agregar subcategorías si existen
  if (subcategories.length > 0) {
    schema.hasPart = subcategories.map(subcat => ({
      "@type": "CollectionPage",
      "name": subcat.name,
      "url": generateCanonicalUrl('category', subcat.slug, baseUrl)
    }));
  }
  
  return schema;
};