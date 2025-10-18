// server.js - OPTIMIZADO PARA PLESK IONOS
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// ✅ FORZAR MODO PRODUCCIÓN (Plesk a veces no setea NODE_ENV correctamente)
const dev = false;
const hostname = process.env.HOSTNAME || '0.0.0.0'; // ✅ Permitir conexiones externas
const port = process.env.PORT || 3000;

console.log(`🚀 Iniciando servidor Next.js...`);
console.log(`📦 Modo desarrollo: ${dev ? 'SÍ' : 'NO'}`);
console.log(`🌐 Hostname: ${hostname}`);
console.log(`🔌 Puerto: ${port}`);

// Configurar Next.js
const app = next({ 
  dev,
  hostname,
  port,
  // ✅ Configuraciones adicionales para Plesk
  customServer: true,
  conf: {
    // Asegurar que use el directorio correcto
    distDir: '.next'
  }
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('✅ Next.js preparado correctamente');
  
  createServer(async (req, res) => {
    try {
      // ✅ Headers CORS básicos para Plesk
      res.setHeader('X-Powered-By', 'Next.js');
      
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
  .once('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  })
  .listen(port, hostname, () => {
    console.log(`✅ Servidor Next.js corriendo en PRODUCCIÓN`);
    console.log(`🌍 URL: http://${hostname}:${port}`);
    console.log(`📂 Directorio: ${process.cwd()}`);
    console.log(`⚡ Ready to accept connections!`);
  });
}).catch((err) => {
  console.error('❌ Error preparando Next.js:', err);
  process.exit(1);
});