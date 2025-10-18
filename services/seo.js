const fs = require('fs');
const path = require('path');

class SEOService {
  constructor() {
    this.siteUrl = process.env.SITE_URL || 'https://judaicabreslovcolombia.com';
    this.siteName = process.env.SITE_NAME || 'Judaica Breslov Colombia';
    this.siteDescription = process.env.SITE_DESCRIPTION || 'Tienda y Librería Judaica Online en Colombia';
  }

  // Generar meta tags para una página específica
  generateMetaTags(pageData) {
    const {
      title,
      description,
      keywords,
      canonicalUrl,
      ogImage,
      ogType = 'website',
      twitterCard = 'summary_large_image',
      structuredData,
      noindex = false,
      nofollow = false
    } = pageData;

    const metaTags = [];

    // Meta tags básicos
    if (title) {
      metaTags.push(`<title>${this.escapeHtml(title)}</title>`);
      metaTags.push(`<meta property="og:title" content="${this.escapeHtml(title)}" />`);
      metaTags.push(`<meta name="twitter:title" content="${this.escapeHtml(title)}" />`);
    }

    if (description) {
      metaTags.push(`<meta name="description" content="${this.escapeHtml(description)}" />`);
      metaTags.push(`<meta property="og:description" content="${this.escapeHtml(description)}" />`);
      metaTags.push(`<meta name="twitter:description" content="${this.escapeHtml(description)}" />`);
    }

    if (keywords) {
      metaTags.push(`<meta name="keywords" content="${this.escapeHtml(keywords)}" />`);
    }

    // Canonical URL
    if (canonicalUrl) {
      metaTags.push(`<link rel="canonical" href="${canonicalUrl}" />`);
      metaTags.push(`<meta property="og:url" content="${canonicalUrl}" />`);
    }

    // Open Graph
    metaTags.push(`<meta property="og:site_name" content="${this.escapeHtml(this.siteName)}" />`);
    metaTags.push(`<meta property="og:type" content="${ogType}" />`);
    metaTags.push(`<meta property="og:locale" content="es_CO" />`);

    if (ogImage) {
      metaTags.push(`<meta property="og:image" content="${ogImage}" />`);
      metaTags.push(`<meta name="twitter:image" content="${ogImage}" />`);
    }

    // Twitter Card
    metaTags.push(`<meta name="twitter:card" content="${twitterCard}" />`);

    // Robots
    const robotsDirectives = [];
    if (noindex) robotsDirectives.push('noindex');
    if (nofollow) robotsDirectives.push('nofollow');
    if (robotsDirectives.length === 0) robotsDirectives.push('index', 'follow');
    
    metaTags.push(`<meta name="robots" content="${robotsDirectives.join(', ')}" />`);

    // Structured Data
    if (structuredData) {
      metaTags.push(`<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`);
    }

    return metaTags.join('\n');
  }

  // Generar structured data para producto
  generateProductStructuredData(product, reviews = []) {
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.short_description || product.description,
      "sku": product.sku,
      "brand": {
        "@type": "Brand",
        "name": this.siteName
      },
      "offers": {
        "@type": "Offer",
        "url": `${this.siteUrl}/productos/${product.slug}`,
        "priceCurrency": "COP",
        "price": product.sale_price || product.price,
        "availability": product.stock_status === 'in_stock' 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": this.siteName
        }
      }
    };

    // Agregar imágenes si existen
    if (product.images && product.images.length > 0) {
      structuredData.image = product.images.map(img => img.image_url);
    }

    // Agregar reseñas si existen
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      structuredData.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": averageRating.toFixed(1),
        "reviewCount": reviews.length,
        "bestRating": 5,
        "worstRating": 1
      };

      structuredData.review = reviews.map(review => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": 5,
          "worstRating": 1
        },
        "author": {
          "@type": "Person",
          "name": review.name
        },
        "reviewBody": review.comment,
        "datePublished": review.created_at
      }));
    }

    return structuredData;
  }

  // Generar structured data para organización
  generateOrganizationStructuredData() {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": this.siteName,
      "url": this.siteUrl,
      "description": this.siteDescription,
      "sameAs": [
        process.env.FACEBOOK_URL,
        process.env.INSTAGRAM_URL
      ].filter(Boolean),
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": process.env.WHATSAPP_NUMBER,
        "contactType": "customer service",
        "availableLanguage": "Spanish"
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "CO",
        "addressLocality": "Bogotá"
      }
    };
  }

  // Generar structured data para breadcrumbs
  generateBreadcrumbStructuredData(breadcrumbs) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": `${this.siteUrl}${crumb.url}`
      }))
    };
  }

  // Generar sitemap XML
  async generateSitemap() {
    const { query } = require('../lib/database');
    
    try {
      const urls = [];

      // Páginas estáticas
      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/productos', priority: '0.9', changefreq: 'daily' },
        { url: '/categorias', priority: '0.8', changefreq: 'weekly' },
        { url: '/contacto', priority: '0.6', changefreq: 'monthly' },
        { url: '/sobre-nosotros', priority: '0.5', changefreq: 'monthly' },
        { url: '/politica-privacidad', priority: '0.3', changefreq: 'yearly' },
        { url: '/terminos-condiciones', priority: '0.3', changefreq: 'yearly' }
      ];

      staticPages.forEach(page => {
        urls.push({
          loc: `${this.siteUrl}${page.url}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: page.changefreq,
          priority: page.priority
        });
      });

      // Productos
      const products = await query(
        'SELECT slug, updated_at FROM products WHERE status = "active"'
      );

      products.forEach(product => {
        urls.push({
          loc: `${this.siteUrl}/productos/${product.slug}`,
          lastmod: new Date(product.updated_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.8'
        });
      });

      // Categorías
      const categories = await query(
        'SELECT slug, updated_at FROM categories'
      );

      categories.forEach(category => {
        urls.push({
          loc: `${this.siteUrl}/categorias/${category.slug}`,
          lastmod: new Date(category.updated_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.7'
        });
      });

      // Posts/Blog
      const posts = await query(
        'SELECT slug, updated_at FROM posts WHERE status = "published"'
      );

      posts.forEach(post => {
        urls.push({
          loc: `${this.siteUrl}/blog/${post.slug}`,
          lastmod: new Date(post.updated_at).toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: '0.6'
        });
      });

      // Generar XML
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      urls.forEach(url => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${url.loc}</loc>\n`;
        sitemap += `    <lastmod>${url.lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>${url.changefreq}</changefreq>\n`;
        sitemap += `    <priority>${url.priority}</priority>\n`;
        sitemap += '  </url>\n';
      });

      sitemap += '</urlset>';

      return sitemap;
    } catch (error) {
      console.error('Error generando sitemap:', error);
      throw error;
    }
  }

  // Generar robots.txt
  generateRobotsTxt() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /mi-cuenta/
Disallow: /carrito/
Disallow: /_next/
Disallow: /static/

Sitemap: ${this.siteUrl}/sitemap.xml`;
    } else {
      return `User-agent: *
Disallow: /`;
    }
  }

  // Optimizar título para SEO
  optimizeTitle(title, maxLength = 60) {
    if (title.length <= maxLength) {
      return title;
    }
    
    const words = title.split(' ');
    let optimizedTitle = '';
    
    for (const word of words) {
      if ((optimizedTitle + ' ' + word).length <= maxLength - 3) {
        optimizedTitle += (optimizedTitle ? ' ' : '') + word;
      } else {
        break;
      }
    }
    
    return optimizedTitle + '...';
  }

  // Optimizar descripción para SEO
  optimizeDescription(description, maxLength = 160) {
    if (description.length <= maxLength) {
      return description;
    }
    
    const sentences = description.split('. ');
    let optimizedDescription = '';
    
    for (const sentence of sentences) {
      if ((optimizedDescription + '. ' + sentence).length <= maxLength - 3) {
        optimizedDescription += (optimizedDescription ? '. ' : '') + sentence;
      } else {
        break;
      }
    }
    
    return optimizedDescription + '...';
  }

  // Escapar HTML para meta tags
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Generar slug SEO-friendly
  generateSlug(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/[\s-]+/g, '-') // Reemplazar espacios y múltiples guiones
      .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
  }

  // Extraer keywords de texto
  extractKeywords(text, maxKeywords = 10) {
    if (!text) return [];
    
    // Palabras comunes a ignorar
    const stopWords = [
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'este', 'esta', 'uno', 'pero', 'sus', 'todo', 'como', 'muy', 'sin', 'puede', 'más', 'dos', 'también'
    ];
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    // Contar frecuencias
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Ordenar por frecuencia y tomar las primeras
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Validar configuración SEO
  validateSEOConfig(pageData) {
    const issues = [];
    
    if (!pageData.title) {
      issues.push('Falta el título de la página');
    } else if (pageData.title.length > 60) {
      issues.push('El título es demasiado largo (máximo 60 caracteres)');
    } else if (pageData.title.length < 30) {
      issues.push('El título es demasiado corto (mínimo 30 caracteres)');
    }
    
    if (!pageData.description) {
      issues.push('Falta la meta descripción');
    } else if (pageData.description.length > 160) {
      issues.push('La meta descripción es demasiado larga (máximo 160 caracteres)');
    } else if (pageData.description.length < 120) {
      issues.push('La meta descripción es demasiado corta (mínimo 120 caracteres)');
    }
    
    if (!pageData.canonicalUrl) {
      issues.push('Falta la URL canónica');
    }
    
    if (!pageData.ogImage) {
      issues.push('Falta la imagen de Open Graph');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

module.exports = SEOService;