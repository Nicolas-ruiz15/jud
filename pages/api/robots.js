// pages/api/robots.js
export default function handler(req, res) {
  const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://www.judaicabreslovcolombia.com/sitemap.xml

# Disallow admin and sensitive areas
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /carrito/
Disallow: /_next/
Disallow: /payment/

# Allow specific important pages
Allow: /
Allow: /productos/
Allow: /categorias/
Allow: /contacto/

# Crawl delay
Crawl-delay: 1

# Specific bot instructions
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2
`;

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(robots);
}