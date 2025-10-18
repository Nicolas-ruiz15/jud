import { verifyToken, requireAdmin } from '../../../../middleware/auth';
import { WooCommerceSyncManager } from '../../../../scripts/sync-woocommerce';

export default async function handler(req, res) {
  // Verificar que sea admin
  await verifyToken(req, res, async () => {
    await requireAdmin(req, res, async () => {
      
      switch (req.method) {
        case 'POST':
          return await startSync(req, res);
        case 'GET':
          return await getSyncStatus(req, res);
        default:
          return res.status(405).json({ success: false, message: 'Método no permitido' });
      }
      
    });
  });
}

// Variables globales para el estado de sincronización
let syncInProgress = false;
let syncStats = null;
let syncError = null;

async function startSync(req, res) {
  try {
    if (syncInProgress) {
      return res.status(409).json({
        success: false,
        message: 'Ya hay una sincronización en progreso'
      });
    }

    const { type = 'full' } = req.body; // 'full', 'categories', 'products'
    
    syncInProgress = true;
    syncStats = null;
    syncError = null;

    // Ejecutar sincronización en background
    const syncManager = new WooCommerceSyncManager();
    
    // No esperar a que termine, responder inmediatamente
    setImmediate(async () => {
      try {
        switch (type) {
          case 'categories':
            await syncManager.syncCategories();
            break;
          case 'products':
            await syncManager.syncProducts();
            break;
          default:
            await syncManager.fullSync();
        }
        
        syncStats = syncManager.stats;
        syncInProgress = false;
        
      } catch (error) {
        console.error('Error en sincronización background:', error);
        syncError = error.message;
        syncInProgress = false;
      }
    });

    return res.status(200).json({
      success: true,
      message: `Sincronización ${type} iniciada`,
      syncId: Date.now().toString()
    });

  } catch (error) {
    syncInProgress = false;
    console.error('Error iniciando sincronización:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function getSyncStatus(req, res) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        inProgress: syncInProgress,
        stats: syncStats,
        error: syncError
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado de sincronización:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}