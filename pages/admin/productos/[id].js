// pages/admin/productos/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const router = useRouter();
  const { id } = router.query;
  const isEditing = id && id !== 'nuevo';
  const productId = isEditing ? id : null;
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    sale_price: '',
    sku: '',
    stock_quantity: 0,
    manage_stock: true,
    stock_status: 'in_stock',
    weight: '',
    dimensions: '',
    featured: false,
    status: 'active',
    meta_title: '',
    meta_description: '',
    category_ids: []
  });

  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEditing && productId) {
      fetchProduct();
    }
  }, [isEditing, productId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      toast.error('Error cargando categorías');
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const product = data.data;
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          short_description: product.short_description || '',
          price: product.price || '',
          sale_price: product.sale_price || '',
          sku: product.sku || '',
          stock_quantity: product.stock_quantity || 0,
          manage_stock: product.manage_stock !== false,
          stock_status: product.stock_status || 'in_stock',
          weight: product.weight || '',
          dimensions: product.dimensions || '',
          featured: product.featured || false,
          status: product.status || 'active',
          meta_title: product.meta_title || '',
          meta_description: product.meta_description || '',
          category_ids: product.categories?.map(c => c.id) || []
        });
        setImages(product.images || []);
      } else {
        toast.error('Error cargando producto: ' + data.message);
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
      toast.error('Error de conexión al cargar producto');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[áàäâã]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöôõ]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[çc]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generar slug cuando se cambia el nombre (solo para productos nuevos)
    if (field === 'name' && !isEditing && value) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }));
    }

    // Auto-generar meta_title si está vacío
    if (field === 'name' && value && !formData.meta_title) {
      setFormData(prev => ({
        ...prev,
        meta_title: value.substring(0, 60)
      }));
    }

    // Limpiar errores
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      // Validar tamaño de archivo (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Archivo ${file.name} es muy grande (máximo 5MB)`);
        return null;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error(`Archivo ${file.name} no es una imagen válida`);
        return null;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      
      try {
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataUpload
        });
        
        const result = await response.json();
        
        if (result.success) {
          return {
            id: Date.now() + Math.random(),
            image_url: result.url,
            alt_text: formData.name || file.name.split('.')[0],
            is_featured: images.length === 0,
            sort_order: images.length
          };
        } else {
          toast.error(`Error subiendo ${file.name}: ${result.message}`);
          return null;
        }
      } catch (error) {
        toast.error(`Error subiendo ${file.name}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const newImages = results.filter(img => img !== null);
      
      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
        toast.success(`${newImages.length} imagen(es) subida(s) exitosamente`);
      }
    } catch (error) {
      console.error('Error en upload masivo:', error);
      toast.error('Error subiendo imágenes');
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = (imageIndex) => {
    setImages(prev => {
      const newImages = prev.filter((_, index) => index !== imageIndex);
      // Si eliminamos la imagen destacada y hay otras, hacer destacada la primera
      if (prev[imageIndex]?.is_featured && newImages.length > 0) {
        newImages[0].is_featured = true;
      }
      return newImages;
    });
    toast.success('Imagen eliminada');
  };

  const handleImageFeature = (imageIndex) => {
    setImages(prev => prev.map((img, index) => ({
      ...img,
      is_featured: index === imageIndex
    })));
    toast.success('Imagen principal actualizada');
  };

  const handleImageReorder = (dragIndex, dropIndex) => {
    setImages(prev => {
      const newImages = [...prev];
      const draggedImage = newImages[dragIndex];
      newImages.splice(dragIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);
      return newImages.map((img, index) => ({
        ...img,
        sort_order: index
      }));
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'El slug solo puede contener letras minúsculas, números y guiones';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }
    
    if (formData.sale_price && parseFloat(formData.sale_price) >= parseFloat(formData.price)) {
      newErrors.sale_price = 'El precio de oferta debe ser menor al precio regular';
    }

    // Validaciones de stock
    if (formData.manage_stock && formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'La cantidad en stock no puede ser negativa';
    }

    // Validaciones SEO
    if (formData.meta_title && formData.meta_title.length > 60) {
      newErrors.meta_title = 'El meta título no debe exceder 60 caracteres';
    }
    
    if (formData.meta_description && formData.meta_description.length > 160) {
      newErrors.meta_description = 'La meta descripción no debe exceder 160 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_quantity: formData.manage_stock ? parseInt(formData.stock_quantity) || 0 : 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: images.map((img, index) => ({
          ...img,
          sort_order: index
        }))
      };

      const url = isEditing 
        ? `/api/admin/products/${productId}`
        : '/api/admin/products';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEditing ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
        setTimeout(() => {
          router.push('/admin/productos');
        }, 1000);
      } else {
        toast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      toast.error('Error de conexión al guardar producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateProduct = async () => {
    if (!isEditing) return;
    
    const duplicatedData = {
      ...formData,
      name: formData.name + ' (Copia)',
      slug: formData.slug + '-copia',
      sku: formData.sku ? formData.sku + '-COPY' : ''
    };
    
    setFormData(duplicatedData);
    toast.success('Producto duplicado. Modifica los datos y guarda.');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="ml-4 text-gray-600">Cargando producto...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? `Editar: ${formData.name}` : 'Nuevo Producto'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header con acciones */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin/productos')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver a productos
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDuplicateProduct}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  📄 Duplicar producto
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                {previewMode ? '📝 Editar' : '👁️ Vista previa'}
              </button>
              
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </span>
                ) : (
                  isEditing ? 'Actualizar Producto' : 'Crear Producto'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información básica */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre del producto"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug * <span className="text-xs text-gray-500">(URL amigable)</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                      /productos/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                      className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.slug ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="slug-del-producto"
                    />
                  </div>
                  {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU <span className="text-xs text-gray-500">(Código único)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="SKU123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">🟢 Activo</option>
                    <option value="inactive">⚫ Inactivo</option>
                    <option value="draft">🟡 Borrador</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción corta
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Descripción breve para listados y vista previa..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.short_description.length}/300 caracteres
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción completa
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Descripción detallada del producto, características, beneficios..."
                />
              </div>
            </div>

            {/* Precios */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Precios</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio regular *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                      step="100"
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  {formData.price && (
                    <p className="text-xs text-gray-500 mt-1">
                      Precio: {formatCurrency(formData.price)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio de oferta <span className="text-xs text-gray-500">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.sale_price}
                      onChange={(e) => handleInputChange('sale_price', e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.sale_price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                      step="100"
                    />
                  </div>
                  {errors.sale_price && <p className="text-red-500 text-sm mt-1">{errors.sale_price}</p>}
                  {formData.sale_price && (
                    <div className="text-xs mt-1">
                      <p className="text-green-600">Precio oferta: {formatCurrency(formData.sale_price)}</p>
                      {formData.price && (
                        <p className="text-gray-500">
                          Descuento: {Math.round(((formData.price - formData.sale_price) / formData.price) * 100)}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inventario */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📦 Inventario</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.manage_stock}
                    onChange={(e) => handleInputChange('manage_stock', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Gestionar inventario automáticamente
                  </label>
                </div>

                {formData.manage_stock && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad en stock
                      </label>
                      <input
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0"
                        min="0"
                      />
                      {errors.stock_quantity && <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado del stock
                      </label>
                      <select
                        value={formData.stock_status}
                        onChange={(e) => handleInputChange('stock_status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="in_stock">✅ En stock</option>
                        <option value="out_of_stock">❌ Agotado</option>
                        <option value="on_backorder">⏳ Pedido pendiente</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles físicos */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📏 Detalles Físicos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (gramos)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Para cálculo de envío</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dimensiones (L x A x H cm)
                  </label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="10 x 5 x 2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Para cálculo de envío</p>
                </div>
              </div>
            </div>

            {/* Imágenes */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                🖼️ Imágenes del Producto 
                {uploading && <span className="text-sm text-blue-500 ml-2">Subiendo...</span>}
              </h3>
              
              {/* Upload de imágenes */}
              <div className="mb-6">
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      ) : (
                        <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )}
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG, WEBP (MAX. 5MB cada una)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* Gallery de imágenes */}
              {images.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Arrastra las imágenes para reordenar. La primera imagen será la principal.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-colors">
                          <Image
                            src={image.image_url}
                            alt={image.alt_text || `Imagen ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          
                          {/* Overlay con acciones */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                              <button
                                type="button"
                                onClick={() => handleImageFeature(index)}
                                className={`p-2 rounded-full text-white transition-colors ${
                                  image.is_featured ? 'bg-yellow-500' : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                                title={image.is_featured ? 'Imagen principal' : 'Hacer principal'}
                              >
                                ⭐
                              </button>
                              <button
                                type="button"
                                onClick={() => handleImageDelete(index)}
                                className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                                title="Eliminar imagen"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col space-y-1">
                          {image.is_featured && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                              Principal
                            </span>
                          )}
                          <span className="bg-gray-900 bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
                            #{index + 1}
                          </span>
                        </div>
                        
                        {/* Alt text input */}
                        <input
                          type="text"
                          placeholder="Texto alternativo..."
                          value={image.alt_text || ''}
                          onChange={(e) => {
                            const newImages = [...images];
                            newImages[index].alt_text = e.target.value;
                            setImages(newImages);
                          }}
                          className="mt-2 w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 SEO y Metadatos</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta título
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange('meta_title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.meta_title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Título para SEO (recomendado: 50-60 caracteres)"
                    maxLength="60"
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span className={formData.meta_title.length > 60 ? 'text-red-500' : 'text-gray-500'}>
                      {formData.meta_title.length}/60 caracteres
                    </span>
                    {formData.meta_title.length > 50 && formData.meta_title.length <= 60 && (
                      <span className="text-yellow-500">Longitud óptima</span>
                    )}
                  </div>
                  {errors.meta_title && <p className="text-red-500 text-sm mt-1">{errors.meta_title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta descripción
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.meta_description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Descripción para SEO (recomendado: 150-160 caracteres)"
                    maxLength="160"
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span className={formData.meta_description.length > 160 ? 'text-red-500' : 'text-gray-500'}>
                      {formData.meta_description.length}/160 caracteres
                    </span>
                    {formData.meta_description.length > 140 && formData.meta_description.length <= 160 && (
                      <span className="text-yellow-500">Longitud óptima</span>
                    )}
                  </div>
                  {errors.meta_description && <p className="text-red-500 text-sm mt-1">{errors.meta_description}</p>}
                </div>

                {/* Preview SEO */}
                {(formData.meta_title || formData.meta_description) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">Vista previa en Google:</p>
                    <div className="text-sm">
                      <div className="text-blue-600 hover:underline cursor-pointer">
                        {formData.meta_title || formData.name}
                      </div>
                      <div className="text-green-600 text-xs">
                        judaicabreslovcolombia.com/productos/{formData.slug}
                      </div>
                      <div className="text-gray-600 mt-1">
                        {formData.meta_description || formData.short_description}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estado de publicación */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">⚙️ Configuración</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <label className="text-sm font-medium text-gray-700">
                    Producto destacado
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del producto
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">🟢 Activo (Visible en tienda)</option>
                    <option value="inactive">⚫ Inactivo (Oculto)</option>
                    <option value="draft">🟡 Borrador (En edición)</option>
                  </select>
                </div>

                {isEditing && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>ID: {productId}</p>
                    <p>Creado: {new Date().toLocaleDateString()}</p>
                    <p>Última actualización: {new Date().toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Categorías */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🏷️ Categorías</h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={formData.category_ids.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 cursor-pointer flex-1">
                      {category.name}
                    </label>
                    {category.product_count && (
                      <span className="text-xs text-gray-400">
                        ({category.product_count})
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              {categories.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">No hay categorías disponibles.</p>
                  <Link href="/admin/productos/categorias" className="text-primary-600 hover:text-primary-800 text-sm">
                    + Crear primera categoría
                  </Link>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {formData.category_ids.length} categoría(s) seleccionada(s)
                </p>
              </div>
            </div>

            {/* Preview del producto */}
            {(formData.name || formData.price) && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">👁️ Vista Previa</h3>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {images.length > 0 && (
                    <div className="aspect-square relative mb-3 overflow-hidden rounded-md bg-white">
                      <Image
                        src={images.find(img => img.is_featured)?.image_url || images[0]?.image_url}
                        alt={formData.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 leading-tight">
                      {formData.name || 'Nombre del producto'}
                    </h4>
                    
                    {formData.short_description && (
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {formData.short_description}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      {formData.sale_price ? (
                        <>
                          <span className="text-lg font-bold text-red-600">
                            {formatCurrency(formData.sale_price)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(formData.price)}
                          </span>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            -{Math.round(((formData.price - formData.sale_price) / formData.price) * 100)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(formData.price)}
                        </span>
                      )}
                    </div>

                    {formData.manage_stock && (
                      <div className="text-xs">
                        {formData.stock_quantity > 0 ? (
                          <span className="text-green-600">✅ En stock ({formData.stock_quantity})</span>
                        ) : (
                          <span className="text-red-600">❌ Agotado</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.category_ids.map(catId => {
                        const category = categories.find(c => c.id === catId);
                        return category ? (
                          <span key={catId} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {category.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href={`/productos/${formData.slug}`}
                    target="_blank"
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Ver en la tienda →
                  </Link>
                </div>
              </div>
            )}

            {/* Acciones rápidas */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">⚡ Acciones Rápidas</h3>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const newSlug = generateSlug(formData.name);
                    handleInputChange('slug', newSlug);
                    toast.success('Slug regenerado');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  disabled={!formData.name}
                >
                  🔄 Regenerar slug
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange('meta_title', formData.name.substring(0, 60));
                    handleInputChange('meta_description', formData.short_description.substring(0, 160));
                    toast.success('SEO generado automáticamente');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  disabled={!formData.name}
                >
                  🎯 Auto-completar SEO
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDuplicateProduct}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    📄 Duplicar producto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default ProductForm;