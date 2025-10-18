// pages/api/admin/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import sharp from 'sharp';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)'));
    }
  }
});

// Middleware para manejar la subida
const uploadMiddleware = upload.array('images', 10);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    // Ejecutar middleware de multer
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return reject(new Error('Archivo muy grande. Máximo 10MB por archivo.'));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return reject(new Error('Demasiados archivos. Máximo 10 archivos.'));
          }
          return reject(err);
        }
        resolve();
      });
    });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se recibieron archivos'
      });
    }

    const uploadedFiles = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');

    // Crear directorios si no existen
    await ensureDirectoryExists(uploadDir);
    await ensureDirectoryExists(path.join(uploadDir, 'thumbnails'));

    for (const file of req.files) {
      try {
        const result = await processImage(file, uploadDir);
        uploadedFiles.push(result);
      } catch (error) {
        console.error(`Error procesando imagen ${file.originalname}:`, error);
        uploadedFiles.push({
          success: false,
          originalName: file.originalname,
          error: error.message
        });
      }
    }

    // Verificar si hubo errores
    const errors = uploadedFiles.filter(f => !f.success);
    const successful = uploadedFiles.filter(f => f.success);

    res.status(200).json({
      success: true,
      message: `${successful.length} archivo(s) subido(s) exitosamente`,
      data: {
        uploaded: successful,
        errors: errors.length > 0 ? errors : undefined,
        total: req.files.length,
        successful: successful.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
}

async function ensureDirectoryExists(dir) {
  try {
    await access(dir);
  } catch (error) {
    await mkdir(dir, { recursive: true });
  }
}

async function processImage(file, uploadDir) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${timestamp}-${randomString}${extension}`;
  const filepath = path.join(uploadDir, filename);
  const thumbnailPath = path.join(uploadDir, 'thumbnails', filename);

  // Procesar imagen principal
  const processedImage = await sharp(file.buffer)
    .resize(1200, 1200, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .jpeg({ 
      quality: 85, 
      progressive: true 
    })
    .toBuffer();

  // Crear thumbnail
  const thumbnail = await sharp(file.buffer)
    .resize(300, 300, { 
      fit: 'cover',
      position: 'center' 
    })
    .jpeg({ 
      quality: 80 
    })
    .toBuffer();

  // Guardar archivos
  await writeFile(filepath, processedImage);
  await writeFile(thumbnailPath, thumbnail);

  // Obtener información de la imagen
  const metadata = await sharp(file.buffer).metadata();

  return {
    success: true,
    originalName: file.originalname,
    filename,
    url: `/uploads/products/${filename}`,
    thumbnailUrl: `/uploads/products/thumbnails/${filename}`,
    size: processedImage.length,
    originalSize: file.size,
    dimensions: {
      width: metadata.width,
      height: metadata.height
    },
    format: metadata.format,
    uploadedAt: new Date().toISOString()
  };
}

// Configuración para Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};