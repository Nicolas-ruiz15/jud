# Documentación de Seguridad - Judaica Breslov Colombia

Este documento describe las medidas de seguridad implementadas en el sitio web de Judaica Breslov Colombia.

## Medidas de Seguridad Implementadas

### 1. Validación de Datos

- **Zod Schema Validation**: Implementación de validación de datos utilizando Zod para todas las entradas de usuario y respuestas de API.
- **Validación de Parámetros**: Validación estricta de parámetros de URL, cuerpos de solicitud y encabezados.

### 2. Limitación de Tasa (Rate Limiting)

- **API General**: Límite de 60 solicitudes por minuto por IP.
- **Endpoints de Pago**: Límite de 10 solicitudes por minuto por IP.
- **Intentos de Inicio de Sesión**: Límite de 5 intentos en 15 minutos, con bloqueo de 15 minutos después de exceder el límite.

### 3. Seguridad de ePayco

- **Validación de Firma**: Verificación criptográfica de firmas en todas las respuestas de ePayco.
- **Proxy Seguro**: Implementación de un proxy seguro para comunicaciones con ePayco con validación estricta de dominios y rutas.
- **Validación de Origen**: Verificación del origen de las solicitudes para prevenir solicitudes falsificadas.
- **Protección CORS**: Encabezados CORS mejorados para endpoints de ePayco para garantizar una comunicación segura entre orígenes.
- **Manejo Detallado de Errores**: Manejo mejorado de errores para la integración con ePayco con registro detallado.

### 4. Seguridad de Base de Datos

- **Conexión SSL**: Verificación de conexiones SSL a la base de datos.
- **Validación de Privilegios**: Verificación de privilegios mínimos para el usuario de la base de datos.
- **Prevención de Inyección SQL**: Uso de consultas parametrizadas y validación de entrada.

### 5. Seguridad de API

- **Encabezados de Seguridad**: Implementación de encabezados de seguridad HTTP como X-Content-Type-Options, X-XSS-Protection, X-Frame-Options.
- **Validación CORS**: Restricción de orígenes permitidos para solicitudes CORS.
- **Validación de Referer**: Verificación de encabezados Referer para prevenir CSRF.

### 6. Gestión de Secretos

- **dotenv-vault**: Implementación de dotenv-vault para gestión segura de secretos.
- **Variables de Entorno**: Separación de configuraciones de desarrollo y producción.

## Scripts de Verificación de Seguridad

Se han implementado varios scripts para verificar la seguridad del sitio:

```bash
# Verificar seguridad de la base de datos
npm run test:db-security

# Verificar seguridad de la integración con ePayco
npm run test:epayco-security

# Verificar seguridad general del sitio
npm run test:site-security

# Ejecutar todas las verificaciones de seguridad
npm run test:security
```

## Middlewares de Seguridad

### Middleware Global de API

Se ha implementado un middleware global para todas las APIs que aplica:

- Encabezados de seguridad
- Validación de métodos HTTP
- Limitación de tamaño de cuerpo de solicitud
- Rate limiting
- Validación de origen y referer
- Prevención de ataques comunes (inyección SQL, XSS)
- Registro de solicitudes sospechosas

### Middleware Específico para ePayco

Se ha implementado un middleware específico para las rutas relacionadas con ePayco que aplica:

- Validación de solicitudes al proxy
- Validación de firmas en webhooks
- Rate limiting específico para pagos
- Validación de origen para solicitudes a ePayco

## Recomendaciones Adicionales

1. **Auditoría Regular**: Realizar auditorías de seguridad periódicas.
2. **Actualizaciones**: Mantener todas las dependencias actualizadas.
3. **Monitoreo**: Implementar monitoreo de seguridad y alertas.
4. **Backups**: Realizar copias de seguridad regulares de la base de datos.
5. **Formación**: Capacitar al personal en prácticas de seguridad.

## Contacto

Para reportar problemas de seguridad, contactar a:

- Email: [seguridad@judaicabreslovcolombia.com](mailto:seguridad@judaicabreslovcolombia.com)