# Solución de Problemas CORS con ePayco

## Resumen de Cambios

Se han realizado las siguientes modificaciones para resolver los problemas de CORS (Cross-Origin Resource Sharing) con ePayco:

1. **Mejora en el proxy de ePayco**:
   - Actualización de los encabezados CORS en todas las respuestas
   - Adición del encabezado `X-Epayco-Key` a la lista de encabezados permitidos
   - Configuración de `Access-Control-Max-Age` para reducir solicitudes preflight
   - Mejora en el manejo de errores con información detallada

2. **Mejora en la configuración global**:
   - Actualización de los encabezados CORS en `next.config.js`
   - Exposición de encabezados adicionales para ePayco

3. **Mejora en el interceptor del cliente**:
   - Mejor manejo de errores y registro detallado
   - Soporte mejorado para XMLHttpRequest
   - Validación adicional de URLs de ePayco

## Cómo Funciona

### Flujo de Solicitudes

1. El componente `EpaycoPayment.js` intercepta todas las solicitudes a dominios de ePayco
2. Las solicitudes se redirigen a través de nuestro proxy en `/api/epayco/proxy`
3. El proxy valida la URL de destino y reenvía la solicitud a ePayco
4. El proxy agrega los encabezados CORS necesarios a todas las respuestas

### Encabezados CORS Configurados

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Epayco-Key
Access-Control-Expose-Headers: Content-Length, Content-Type, Date, Server, X-Epayco-Key
Access-Control-Max-Age: 86400
```

## Solución de Problemas

### Errores Comunes

1. **Error de CORS en el navegador**:
   - Verificar que el proxy esté funcionando correctamente
   - Revisar los logs del servidor para ver si hay errores en el proxy
   - Comprobar que la URL de ePayco esté en la lista de dominios permitidos

2. **Error 403 o 400 del proxy**:
   - Verificar que la URL de destino sea válida y esté en la lista de dominios permitidos
   - Comprobar que la URL comience con `https://`

3. **No se carga el checkout de ePayco**:
   - Verificar que la clave pública de ePayco esté configurada correctamente
   - Comprobar que el script de ePayco se cargue correctamente
   - Revisar los logs del navegador para ver si hay errores

### Depuración

El componente `EpaycoPayment.js` incluye logs detallados que pueden ayudar a identificar problemas:

- Logs de interceptación de solicitudes
- Logs de redirección a través del proxy
- Logs de errores detallados
- Información sobre respuestas no exitosas

## Dominios de ePayco Permitidos

- `secure.epayco.co`
- `apify-private.epayco.co`
- `checkout.epayco.co`
- `api.secure.epayco.co`
- `api.epayco.co`

## Recomendaciones

1. **Mantener actualizada la lista de dominios permitidos**:
   - Si ePayco agrega nuevos dominios, actualizar la lista en `lib/epayco-validation.js`

2. **Monitorear los logs del servidor**:
   - Revisar regularmente los logs para detectar problemas con el proxy

3. **Probar en diferentes navegadores**:
   - Algunos navegadores tienen políticas CORS más estrictas que otros

4. **Contactar a soporte de ePayco**:
   - Si los problemas persisten, contactar a soporte de ePayco para verificar si hay cambios en su API