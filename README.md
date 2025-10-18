# Judaica Breslov Colombia - Tienda Online

## Descripción

Tienda online para Judaica Breslov Colombia, desarrollada con Next.js, MySQL y ePayco para procesamiento de pagos.

## Requisitos

- Node.js 16.x o superior
- MySQL 8.0 o superior
- npm o yarn

## Instalación

1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd <directorio-del-proyecto>
```

2. Instalar dependencias

```bash
npm install
# o
yarn install
```

3. Configurar variables de entorno

```bash
cp .env.example .env
cp .env.local.example .env.local
```

Edita los archivos `.env` y `.env.local` con tus valores específicos.

4. Configurar la base de datos

```bash
npm run migrate
# o
yarn migrate
```

5. Crear usuario administrador

```bash
npm run setup-admin
# o
yarn setup-admin
```

## Desarrollo

```bash
npm run dev
# o
yarn dev
```

Visita `http://localhost:3000` para ver la aplicación.

## Producción

```bash
npm run build
npm start
# o
yarn build
yarn start
```

## Seguridad

### Variables de entorno

- **Variables privadas**: Deben estar en `.env` (no accesibles desde el navegador)
- **Variables públicas**: Deben estar en `.env.local` y comenzar con `NEXT_PUBLIC_`

### Base de datos

- Se recomienda habilitar SSL para conexiones a la base de datos en producción
- Configurar `DB_USE_SSL=true` y `DB_REJECT_UNAUTHORIZED=true` en `.env`

### ePayco

- Todas las solicitudes a ePayco se enrutan a través de un proxy seguro
- Se validan firmas en las confirmaciones de pago
- Se implementan cabeceras de seguridad para prevenir ataques

## Estructura del proyecto

- `/components`: Componentes React reutilizables
- `/pages`: Rutas de la aplicación y API
- `/lib`: Utilidades y funciones comunes
- `/services`: Servicios externos (ePayco, etc.)
- `/public`: Archivos estáticos
- `/scripts`: Scripts de utilidad y migración

## Integración con ePayco

### Configuración

1. Configura las claves de ePayco en `.env` y `.env.local`:
   - `NEXT_PUBLIC_EPAYCO_PUBLIC_KEY` en `.env.local` (clave pública)
   - `EPAYCO_PRIVATE_KEY`, `EPAYCO_P_CUST_ID_CLIENTE` y `EPAYCO_P_KEY` en `.env` (claves privadas)

2. Configura las URLs de confirmación y respuesta en el panel de ePayco:
   - URL de confirmación: `https://tu-dominio.com/api/payment/epayco/confirmation`
   - URL de respuesta: `https://tu-dominio.com/payment/response`

### Flujo de pago

1. El cliente selecciona productos y procede al checkout
2. Se crea una orden temporal en la base de datos
3. Se redirige al cliente a la pasarela de ePayco
4. ePayco procesa el pago y envía confirmación al webhook
5. El webhook valida la firma y actualiza el estado de la orden
6. El cliente es redirigido a la página de respuesta

## Mantenimiento

### Limpieza de la base de datos

```bash
npm run cleanup
# o
yarn cleanup
```

### Sincronización con WooCommerce (si aplica)

```bash
npm run sync-woocommerce
# o
yarn sync-woocommerce
```

## Soporte

Para soporte técnico, contacta a [soporte@judaicabreslovcolombia.com](mailto:soporte@judaicabreslovcolombia.com)