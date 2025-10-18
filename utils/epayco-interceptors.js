// utils/epayco-interceptors.js

/**
 * Configura un interceptor global para window.fetch para redirigir
 * las llamadas específicas de ePayco a apify-private.epayco.co/getip
 * hacia nuestro proxy local /api/epayco/getip (o /api/get-ip).
 * Esto ayuda a resolver problemas de CORS que la librería de ePayco
 * pueda tener con esta URL en particular al ser llamada desde el navegador.
 */
export const setupCorsInterceptor = () => {
  // Asegúrate de que este código solo se ejecute en el entorno del navegador.
  if (typeof window === 'undefined') {
    return;
  }

  // Si el interceptor ya ha sido configurado, no hacemos nada para evitar duplicados.
  // Usamos una propiedad personalizada en window.fetch para marcar que ya se aplicó.
  if (window.fetch._epaycoPatched) {
    console.log('🔧 Interceptor ePayco ya configurado.');
    return;
  }

 
  // Guardamos una referencia a la función original de fetch.
  const originalFetch = window.fetch;

  // Sobrescribimos window.fetch con nuestra función interceptora.
  window.fetch = function(...args) {
    const [url, options] = args;

    // Verificamos si la URL de la petición es la específica de ePayco que causa problemas de CORS.
    // Es crucial que la cadena a buscar ('apify-private.epayco.co/getip') sea exacta.
    if (typeof url === 'string' && url.includes('apify-private.epayco.co/getip')) {
      console.log('🔄 INTERCEPTANDO GETIP de ePayco! Redirigiendo a /api/epayco/getip...');

      // Realizamos la petición a nuestro propio proxy `/api/epayco/getip`.
      // Esto asegura que la petición de la IP se haga desde nuestro servidor (backend-to-backend),
      // lo cual no tiene problemas de CORS con ePayco.
      return originalFetch('/api/epayco/getip', { // O '/api/get-ip' si así la nombras
        method: 'GET',
        headers: { 'Accept': '*/*' }, // Enviamos un Accept header básico
        // Aquí podrías copiar otros headers importantes si el proxy los necesitara,
        // pero para getip, GET y Accept suelen ser suficientes.
      }).then(response => {
        // Si nuestro proxy responde correctamente, pasamos la respuesta.
        console.log('✅ Proxy /api/epayco/getip respondió con status:', response.status);
        return response;
      }).catch(error => {
        // Si hay un error al contactar a nuestro proxy (o si el proxy falló internamente),
        // proveemos una IP de fallback para que el script de ePayco pueda continuar.
        console.warn('⚠️ Error al contactar el proxy /api/epayco/getip, usando IP de fallback:', error);
        return new Response('181.129.183.19', { // IP genérica de Colombia o la que sea más apropiada
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    }

    // Para cualquier otra petición que no sea la de 'getip' de ePayco,
    // usamos la función original de fetch.
    return originalFetch.apply(this, args);
  };

  // Marcamos que window.fetch ya ha sido parcheado por nuestro interceptor.
  window.fetch._epaycoPatched = true;
 };