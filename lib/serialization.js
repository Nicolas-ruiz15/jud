/**
 * Serializa datos para que sean compatibles con JSON y Next.js getStaticProps
 * Convierte fechas a strings ISO y maneja objetos anidados
 */
export function serializeData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (typeof data === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else if (value && typeof value === 'object') {
        serialized[key] = serializeData(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }

  return data;
}

/**
 * Serializa los datos de respuesta de MariaDB
 * MariaDB devuelve fechas como objetos Date que necesitan ser serializados
 */
export function serializeDatabaseResult(result) {
  if (!result) return null;
  
  if (Array.isArray(result)) {
    return result.map(row => serializeDatabaseResult(row));
  }

  if (typeof result === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(result)) {
      // Detectar campos de fecha comunes
      if (key.includes('_at') || key.includes('date') || value instanceof Date) {
        serialized[key] = value instanceof Date ? value.toISOString() : value;
      } else if (value && typeof value === 'object') {
        serialized[key] = serializeDatabaseResult(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }

  return result;
}

/**
 * Convierte strings de fecha de vuelta a objetos Date para el cliente
 */
export function deserializeDates(data, dateFields = ['created_at', 'updated_at']) {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => deserializeDates(item, dateFields));
  }

  if (typeof data === 'object') {
    const deserialized = { ...data };
    for (const field of dateFields) {
      if (deserialized[field] && typeof deserialized[field] === 'string') {
        deserialized[field] = new Date(deserialized[field]);
      }
    }
    return deserialized;
  }

  return data;
}

/**
 * Formatea una fecha para mostrar al usuario
 */
export function formatDate(dateString, locale = 'es-CO') {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatea una fecha y hora para mostrar al usuario
 */
export function formatDateTime(dateString, locale = 'es-CO') {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcula tiempo relativo (hace X minutos, hace X horas, etc.)
 */
export function timeAgo(dateString, locale = 'es-CO') {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'hace un momento';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `hace ${diffInYears} año${diffInYears > 1 ? 's' : ''}`;
}