// /pages/api/admin/settings.js
import { query } from '../../../lib/database';
// import { adminAuth } from '../../../middleware/adminAuth'; // Asegúrate de proteger esta ruta

/**
 * Obtiene todas las configuraciones del sistema desde la base de datos y las formatea como un objeto.
 */
async function getSettings(req, res) {
  try {
    const settingsRows = await query('SELECT * FROM system_settings');
    
    // Convertir el array de filas de la DB en un objeto clave-valor
    const settingsObject = settingsRows.reduce((acc, setting) => {
      let value = setting.setting_value;
      // Convertir los valores a su tipo correcto para el frontend
      switch (setting.setting_type) {
        case 'number':
          value = Number(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try { value = JSON.parse(value); } catch (e) { value = {}; }
          break;
      }
      acc[setting.setting_key] = value;
      return acc;
    }, {});

    res.status(200).json({ success: true, data: settingsObject });
  } catch (error) {
    console.error('API Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la configuración.' });
  }
}

/**
 * Recibe un objeto con todas las configuraciones y las actualiza en la base de datos.
 */
async function updateSettings(req, res) {
  const settings = req.body;
  
  if (typeof settings !== 'object' || settings === null) {
    return res.status(400).json({ success: false, message: 'Datos inválidos.' });
  }

  const queries = [];
  const params = [];

  for (const key in settings) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      let value = settings[key];
      let type = typeof value;

      // Determinar el tipo para la base de datos
      if (type === 'boolean') {
        type = 'boolean';
        value = value ? 'true' : 'false';
      } else if (type === 'number') {
        type = 'number';
      } else {
        type = 'text'; // 'text' es el tipo por defecto en tu tabla
      }

      // Usamos INSERT ... ON DUPLICATE KEY UPDATE para crear o actualizar el ajuste
      queries.push(`
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), setting_type = VALUES(setting_type)
      `);
      params.push(key, String(value), type, `Ajuste para ${key}`);
    }
  }

  try {
    // Aquí se podrían ejecutar todas las consultas en una transacción si tu librería de DB lo soporta.
    // Por simplicidad, las ejecutamos en secuencia.
    for (let i = 0; i < queries.length; i++) {
        const singleQuery = queries[i];
        const singleParams = [params[i*4], params[i*4 + 1], params[i*4 + 2], params[i*4 + 3]];
        await query(singleQuery, singleParams);
    }

    res.status(200).json({ success: true, message: 'Configuración guardada exitosamente.' });
  } catch (error) {
    console.error('API Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Error al guardar la configuración.' });
  }
}

export default async function handler(req, res) {
  // const user = await adminAuth(req);
  // if (!user) return res.status(401).json({ success: false, message: 'No autorizado' });
  
  switch (req.method) {
    case 'GET':
      return await getSettings(req, res);
    case 'POST':
      return await updateSettings(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ success: false, message: `Método ${req.method} no permitido` });
  }
}