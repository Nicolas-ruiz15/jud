// pages/api/admin/categories/cache.js
import { adminAuth } from '../../../../middleware/adminAuth';
import { 
  getCacheInfo, 
  clearCategoryCache, 
  warmUpCategoryCache,
  invalidateCategoryCache 
} from '../../../../lib/categoryCache';

async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getCacheStatus(req, res);
      case 'POST':
        return await handleCacheAction(req, res);
      case 'DELETE':
        return await clearCache(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: `Método ${method} no permitido`
        });
    }
  } catch (error) {
    console.error('Error en cache API:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// GET - Obtener estado del cache
async function getCacheStatus(req, res) {
  try {
    const cacheInfo = getCacheInfo();
    
    res.status(200).json({
      success: true,
      data: {
        ...cacheInfo,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado del cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado del cache'
    });
  }
}

// POST - Acciones del cache
async function handleCacheAction(req, res) {
  try {
    const { action, category_id, parent_id } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Acción requerida'
      });
    }

    let result = {};

    switch (action) {
      case 'warm_up':
        await warmUpCategoryCache();
        result = { message: 'Cache precargado exitosamente' };
        break;

      case 'invalidate':
        if (category_id || parent_id) {
          invalidateCategoryCache(category_id, parent_id);
          result = { 
            message: `Cache invalidado para categoría ${category_id || 'parent_' + parent_id}` 
          };
        } else {
          return res.status(400).json({
            success: false,
            message: 'category_id o parent_id requerido para invalidar'
          });
        }
        break;

      case 'refresh':
        clearCategoryCache();
        await warmUpCategoryCache();
        result = { message: 'Cache refrescado completamente' };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Acción no válida. Acciones disponibles: warm_up, invalidate, refresh'
        });
    }

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error en acción de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando acción de cache'
    });
  }
}

// DELETE - Limpiar cache
async function clearCache(req, res) {
  try {
    clearCategoryCache();
    
    res.status(200).json({
      success: true,
      message: 'Cache limpiado exitosamente'
    });
  } catch (error) {
    console.error('Error limpiando cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error limpiando cache'
    });
  }
}

export default adminAuth(handler);