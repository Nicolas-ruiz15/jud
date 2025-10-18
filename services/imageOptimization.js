const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class ImageOptimizationService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.optimizedDir = path.join(process.cwd(), 'public', 'optimized');
    this.maxFileSize = parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760; // 10MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    this.qualities = {
      jpeg: 80,
      webp: 85,
      avif: 70,
      png: 90
    };
  }

  // Inicializar directorios
  async initializeDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
      
      // Crear subdirectorios por año/mes
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      await fs.mkdir(path.join(this.uploadDir, String(year), month), { recursive: true });
      await fs.mkdir(path.join(this.optimizedDir, String(year), month), { recursive: true });
    } catch (error) {
      console.error('Error inicializando directorios:', error);
    }
  }

  // Validar archivo de imagen
  validateImage(file) {
    const errors = [];

    // Validar tipo de archivo
    if (!this.allowedTypes.includes(file.mimetype)) {
      errors.push(`Tipo de archivo no permitido. Tipos permitidos: ${this.allowedTypes.join(', ')}`);
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      errors.push(`Archivo demasiado grande. Tamaño máximo: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generar nombre único para archivo
  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName).toLowerCase();
    const nameWithoutExt = path.basename(originalName, ext);
    
    // Limpiar nombre del archivo
    const cleanName = nameWithoutExt
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);

    return `${cleanName}-${timestamp}-${random}${ext}`;
  }

  // Procesar y optimizar imagen
  async processImage(inputBuffer, options = {}) {
    const {
      width,
      height,
      quality,
      format = 'auto',
      maintainAspectRatio = true,
      background = { r: 255, g: 255, b: 255, alpha: 1 }
    } = options;

    try {
      let pipeline = sharp(inputBuffer);

      // Obtener metadata de la imagen original
      const metadata = await pipeline.metadata();
      
      // Rotar automáticamente basado en EXIF
      pipeline = pipeline.rotate();

      // Redimensionar si se especifican dimensiones
      if (width || height) {
        const resizeOptions = {
          width,
          height,
          fit: maintainAspectRatio ? 'inside' : 'fill',
          background
        };
        pipeline = pipeline.resize(resizeOptions);
      }

      // Optimizar según el formato
      switch (format) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({
            quality: quality || this.qualities.jpeg,
            progressive: true,
            mozjpeg: true
          });
          break;
        
        case 'webp':
          pipeline = pipeline.webp({
            quality: quality || this.qualities.webp,
            effort: 6
          });
          break;
        
        case 'avif':
          pipeline = pipeline.avif({
            quality: quality || this.qualities.avif,
            effort: 4
          });
          break;
        
        case 'png':
          pipeline = pipeline.png({
            quality: quality || this.qualities.png,
            progressive: true,
            compressionLevel: 9
          });
          break;
        
        default:
          // Auto: mantener formato original pero optimizado
          if (metadata.format === 'jpeg') {
            pipeline = pipeline.jpeg({
              quality: quality || this.qualities.jpeg,
              progressive: true,
              mozjpeg: true
            });
          } else if (metadata.format === 'png') {
            pipeline = pipeline.png({
              quality: quality || this.qualities.png,
              progressive: true,
              compressionLevel: 9
            });
          } else {
            // Convertir a WebP por defecto para otros formatos
            pipeline = pipeline.webp({
              quality: quality || this.qualities.webp,
              effort: 6
            });
          }
      }

      return await pipeline.toBuffer();
    } catch (error) {
      console.error('Error procesando imagen:', error);
      throw new Error('Error al procesar la imagen');
    }
  }

  // Crear múltiples versiones de una imagen
  async createImageVariants(inputBuffer, basename) {
    const variants = {};
    
    try {
      // Versión original optimizada
      variants.original = await this.processImage(inputBuffer);
      
      // Versión thumbnail (300x300)
      variants.thumbnail = await this.processImage(inputBuffer, {
        width: 300,
        height: 300,
        format: 'webp'
      });
      
      // Versión mediana (600x600)
      variants.medium = await this.processImage(inputBuffer, {
        width: 600,
        height: 600,
        format: 'webp'
      });
      
      // Versión grande (1200x1200)
      variants.large = await this.processImage(inputBuffer, {
        width: 1200,
        height: 1200,
        format: 'webp'
      });
      
      // Versión para redes sociales (1200x630)
      variants.social = await this.processImage(inputBuffer, {
        width: 1200,
        height: 630,
        maintainAspectRatio: false,
        format: 'webp'
      });

      return variants;
    } catch (error) {
      console.error('Error creando variantes de imagen:', error);
      throw error;
    }
  }

  // Guardar imagen y sus variantes
  async saveImage(file, options = {}) {
    try {
      await this.initializeDirectories();

      // Validar archivo
      const validation = this.validateImage(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Generar nombre único
      const filename = this.generateUniqueFilename(file.originalname);
      const nameWithoutExt = path.basename(filename, path.extname(filename));
      
      // Crear path con año/mes
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const relativePath = path.join(String(year), month);

      // Leer buffer del archivo
      const inputBuffer = file.buffer || await fs.readFile(file.path);

      // Crear variantes de la imagen
      const variants = await this.createImageVariants(inputBuffer, nameWithoutExt);

      // Guardar cada variante
      const savedFiles = {};
      
      for (const [variant, buffer] of Object.entries(variants)) {
        const variantFilename = variant === 'original' 
          ? filename 
          : `${nameWithoutExt}-${variant}.webp`;
        
        const fullPath = path.join(this.optimizedDir, relativePath, variantFilename);
        await fs.writeFile(fullPath, buffer);
        
        savedFiles[variant] = {
          filename: variantFilename,
          path: path.join(relativePath, variantFilename),
          url: `/optimized/${relativePath}/${variantFilename}`,
          size: buffer.length
        };
      }

      // Obtener metadata de la imagen original
      const metadata = await sharp(inputBuffer).metadata();

      return {
        success: true,
        files: savedFiles,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: inputBuffer.length
        }
      };

    } catch (error) {
      console.error('Error guardando imagen:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Eliminar imagen y sus variantes
  async deleteImage(imagePath) {
    try {
      const fullPath = path.join(this.optimizedDir, imagePath);
      const dir = path.dirname(fullPath);
      const nameWithoutExt = path.basename(fullPath, path.extname(fullPath));

      // Eliminar archivo original
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        console.log('Archivo original no encontrado:', fullPath);
      }

      // Eliminar variantes
      const variants = ['thumbnail', 'medium', 'large', 'social'];
      for (const variant of variants) {
        const variantPath = path.join(dir, `${nameWithoutExt}-${variant}.webp`);
        try {
          await fs.unlink(variantPath);
        } catch (error) {
          console.log('Variante no encontrada:', variantPath);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      return { success: false, error: error.message };
    }
  }

  // Generar WebP desde imagen existente
  async generateWebP(imagePath, quality = 85) {
    try {
      const fullPath = path.join(this.optimizedDir, imagePath);
      const outputPath = fullPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

      const buffer = await fs.readFile(fullPath);
      const webpBuffer = await sharp(buffer)
        .webp({ quality, effort: 6 })
        .toBuffer();

      await fs.writeFile(outputPath, webpBuffer);

      return {
        success: true,
        webpPath: outputPath.replace(this.optimizedDir, ''),
        originalSize: buffer.length,
        webpSize: webpBuffer.length,
        savings: Math.round((1 - webpBuffer.length / buffer.length) * 100)
      };
    } catch (error) {
      console.error('Error generando WebP:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener información de una imagen
  async getImageInfo(imagePath) {
    try {
      const fullPath = path.join(this.optimizedDir, imagePath);
      const buffer = await fs.readFile(fullPath);
      const metadata = await sharp(buffer).metadata();
      const stats = await fs.stat(fullPath);

      return {
        success: true,
        info: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: stats.size,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          channels: metadata.channels
        }
      };
    } catch (error) {
      console.error('Error obteniendo información de imagen:', error);
      return { success: false, error: error.message };
    }
  }

  // Batch optimization para múltiples imágenes
  async batchOptimize(imagePaths, options = {}) {
    const results = [];

    for (const imagePath of imagePaths) {
      try {
        const fullPath = path.join(this.optimizedDir, imagePath);
        const buffer = await fs.readFile(fullPath);
        const optimizedBuffer = await this.processImage(buffer, options);
        
        await fs.writeFile(fullPath, optimizedBuffer);
        
        results.push({
          path: imagePath,
          success: true,
          originalSize: buffer.length,
          optimizedSize: optimizedBuffer.length,
          savings: Math.round((1 - optimizedBuffer.length / buffer.length) * 100)
        });
      } catch (error) {
        results.push({
          path: imagePath,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Generar srcset para imágenes responsivas
  generateSrcSet(basePath, variants) {
    const srcset = [];
    
    if (variants.thumbnail) {
      srcset.push(`${variants.thumbnail.url} 300w`);
    }
    if (variants.medium) {
      srcset.push(`${variants.medium.url} 600w`);
    }
    if (variants.large) {
      srcset.push(`${variants.large.url} 1200w`);
    }
    if (variants.original) {
      srcset.push(`${variants.original.url} 1920w`);
    }

    return srcset.join(', ');
  }

  // Generar sizes attribute para imágenes responsivas
  generateSizes(breakpoints = {}) {
    const defaultBreakpoints = {
      mobile: '(max-width: 768px) 100vw',
      tablet: '(max-width: 1024px) 50vw',
      desktop: '25vw',
      ...breakpoints
    };

    return Object.values(defaultBreakpoints).join(', ');
  }
}

module.exports = ImageOptimizationService;