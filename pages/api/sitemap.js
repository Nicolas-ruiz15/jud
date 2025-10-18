// pages/api/sitemap.js - SITEMAP ACTUALIZADO CON BLOG
import { query } from '../../lib/database';

export default async function handler(req, res) {
  try {
    const baseUrl = 'https://www.judaicabreslovcolombia.com';
    
    // Obtener productos activos
    const products = await query(`
      SELECT slug, updated_at, created_at, featured, price, sale_price
      FROM products 
      WHERE status = 'active' 
      ORDER BY updated_at DESC
    `);
    
    // Obtener categorías activas
    const categories = await query(`
      SELECT slug, updated_at, created_at, featured
      FROM categories 
      WHERE status = 'active'
      ORDER BY updated_at DESC
    `);
    
    // Obtener posts del blog
    const blogPosts = await query(`
      SELECT slug, updated_at, published_at, featured, views_count
      FROM blog_posts 
      WHERE status = 'published' AND published_at <= NOW()
      ORDER BY updated_at DESC
    `);

    // Obtener categorías del blog
    const blogCategories = await query(`
      SELECT slug, updated_at, created_at
      FROM blog_categories 
      WHERE status = 'active'
      ORDER BY updated_at DESC
    `);

    // Función para formatear fecha
    const formatDate = (date) => {
      return new Date(date).toISOString();
    };

    // Función para determinar prioridad
    const getPriority = (type, item) => {
      switch(type) {
        case 'home': return '1.0';
        case 'blog-main': return '0.9';
        case 'categories': return '0.8';
        case 'blog-categories': return '0.7';
        case 'products': 
          if (item.featured) return '0.8';
          if (item.sale_price && item.sale_price < item.price) return '0.7';
          return '0.6';
        case 'blog-posts':
          if (item.featured) return '0.7';
          if (item.views_count > 100) return '0.6';
          return '0.5';
        case 'pages': return '0.5';
        default: return '0.5';
      }
    };

    // Función para determinar changefreq
    const getChangefreq = (type) => {
      switch(type) {
        case 'home': return 'daily';
        case 'blog-main': return 'daily';
        case 'categories': return 'weekly';
        case 'blog-categories': return 'weekly';
        case 'products': return 'weekly';
        case 'blog-posts': return 'monthly';
        case 'pages': return 'monthly';
        default: return 'monthly';
      }
    };

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  
  <!-- Página principal -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Blog principal -->
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Páginas principales -->
  <url>
    <loc>${baseUrl}/productos</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/categorias</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/contacto</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/carrito</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Categorías de productos -->
  ${categories.map(category => `
  <url>
    <loc>${baseUrl}/categorias/${category.slug}</loc>
    <lastmod>${formatDate(category.updated_at)}</lastmod>
    <changefreq>${getChangefreq('categories')}</changefreq>
    <priority>${getPriority('categories', category)}</priority>
  </url>`).join('')}

  <!-- Categorías del blog -->
  ${blogCategories.map(category => `
  <url>
    <loc>${baseUrl}/blog?categoria=${category.slug}</loc>
    <lastmod>${formatDate(category.updated_at)}</lastmod>
    <changefreq>${getChangefreq('blog-categories')}</changefreq>
    <priority>${getPriority('blog-categories', category)}</priority>
  </url>`).join('')}

  <!-- Productos dinámicos -->
  ${products.map(product => `
  <url>
    <loc>${baseUrl}/productos/${product.slug}</loc>
    <lastmod>${formatDate(product.updated_at)}</lastmod>
    <changefreq>${getChangefreq('products')}</changefreq>
    <priority>${getPriority('products', product)}</priority>
  </url>`).join('')}

  <!-- Posts del blog -->
  ${blogPosts.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${formatDate(post.updated_at)}</lastmod>
    <changefreq>${getChangefreq('blog-posts')}</changefreq>
    <priority>${getPriority('blog-posts', post)}</priority>
  </url>`).join('')}

  <!-- Páginas adicionales importantes -->
  <url>
    <loc>${baseUrl}/sobre-nosotros</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/envios</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/metodos-pago</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/terminos-condiciones</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/politica-privacidad</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>`;

    // Headers para cache y tipo de contenido
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200'); // 24h cache, 12h stale
    res.status(200).send(sitemap);
    
    console.log(`✅ Sitemap generado: ${products.length} productos, ${categories.length} categorías de productos, ${blogPosts.length} posts del blog, ${blogCategories.length} categorías del blog`);
    
  } catch (error) {
    console.error('❌ Error generando sitemap:', error);
    
    // Sitemap básico de fallback
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.judaicabreslovcolombia.com</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.judaicabreslovcolombia.com/productos</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.judaicabreslovcolombia.com/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.judaicabreslovcolombia.com/categorias</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(fallbackSitemap);
  }
}