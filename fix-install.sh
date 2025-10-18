#!/bin/bash

echo "🔧 Arreglando instalación de Judaica Breslov Colombia..."

# Limpiar instalación anterior
echo "🧹 Limpiando archivos anteriores..."
rm -rf node_modules package-lock.json .next

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p styles
mkdir -p public/images/categories
mkdir -p public/images/products
mkdir -p public/optimized
mkdir -p logs
mkdir -p types

# Crear archivo next-env.d.ts
echo "📝 Creando archivo next-env.d.ts..."
cat > next-env.d.ts << 'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

# Crear archivo de estilos mínimo si no existe
if [ ! -f "styles/globals.css" ]; then
    echo "🎨 Creando archivo de estilos..."
    cat > styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
  body {
    color: white;
    background: black;
  }
}
EOF
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "⚙️ Creando archivo .env..."
    cp .env.example .env
    echo "✅ Archivo .env creado. Por favor configura tus credenciales."
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar instalación
echo "🔍 Verificando instalación..."
if npm list --depth=0 > /dev/null 2>&1; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "⚠️ Algunas dependencias tienen problemas, pero la instalación puede continuar"
fi

# Intentar build
echo "🏗️ Probando compilación..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Compilación exitosa"
    echo ""
    echo "🎉 ¡Instalación completada!"
    echo ""
    echo "📋 Siguientes pasos:"
    echo "1. Configura tu archivo .env con las credenciales de base de datos"
    echo "2. Ejecuta: npm run db:migrate"
    echo "3. Ejecuta: npm run db:seed (opcional)"
    echo "4. Ejecuta: npm run dev"
    echo ""
    echo "Para sincronizar WooCommerce:"
    echo "- Configura las credenciales WooCommerce en .env"
    echo "- Ejecuta: npm run sync:woocommerce"
else
    echo "⚠️ La compilación falló, pero los archivos están configurados"
    echo "Ejecuta 'npm run build' para ver los errores específicos"
fi

echo ""
echo "🔗 Enlaces útiles:"
echo "- Desarrollo: http://localhost:3000"
echo "- Admin: http://localhost:3000/admin/sync"
echo "- Documentación: ./WOOCOMMERCE_SYNC.md"