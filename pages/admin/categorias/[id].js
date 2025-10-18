// pages/admin/categorias/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CategoryForm = () => {
  const router = useRouter();
  const { id } = router.query;
  const isEditing = id && id !== 'nueva';
  const categoryId = isEditing ? id : null;
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    image_url: '',
    icon: '',
    meta_title: '',
    meta_description: '',
    featured: false,
    status: 'active',
    color: '',
    sort_order: 0
  });

  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [hierarchy, setHierarchy] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    fetchParentCategories();
    if (isEditing && categoryId) {
      fetchCategory();
    }
  }, [isEditing, categoryId]);

  const fetchParentCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories?limit=100&parent_id=null', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Filtrar la categoría actual si estamos editando
        const filtered = isEditing 
          ? data.data.filter(cat => cat.id != categoryId)
          : data.data;
        setParentCategories(filtered);
      }
    } catch (error) {
      console.error('Error cargando categorías padre:', error);
      toast.error('Error cargando categorías padre');
    }
  };

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const category = data.data;
        setFormData({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          parent_id: category.parent_id || '',
          image_url: category.image_url || '',
          icon: category.icon || '',
          meta_title: category.meta_title || '',
          meta_description: category.meta_description || '',
          featured: category.featured || false,
          status: category.status || 'active',
          color: category.color || '',
          sort_order: category.sort_order || 0
        });
        
        // Establecer datos adicionales
        setHierarchy(category.hierarchy_path || []);
        setRecentProducts(category.recent_products || []);
      } else {
        toast.error('Error cargando categoría: ' + data.message);
      }
    } catch (error) {
      console.error('Error cargando categoría:', error);
      toast.error('Error de conexión al cargar categoría');
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

    // Auto-generar slug cuando se cambia el nombre (solo para categorías nuevas)
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

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validar tamaño de archivo (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es muy grande (máximo 5MB)');
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('images', file);
    
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload
      });
      
      const result = await response.json();
      
      if (result.success && result.data.uploaded.length > 0) {
        const uploadedImage = result.data.uploaded[0];
        setFormData(prev => ({
          ...prev,
          image_url: uploadedImage.url
        }));
        toast.success('Imagen subida exitosamente');
      } else {
        toast.error('Error subiendo imagen: ' + (result.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      toast.error('Error subiendo imagen');
    } finally {
      setUploading(false);
    }
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

    // Validaciones SEO
    if (formData.meta_title && formData.meta_title.length > 60) {
      newErrors.meta_title = 'El meta título no debe exceder 60 caracteres';
    }
    
    if (formData.meta_description && formData.meta_description.length > 160) {
      newErrors.meta_description = 'La meta descripción no debe exceder 160 caracteres';
    }

    // Validación de color (si se proporciona)
    if (formData.color && !/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = 'El color debe ser un código hexadecimal válido (ej: #FF0000)';
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
        sort_order: parseInt(formData.sort_order) || 0,
        parent_id: formData.parent_id || null
      };

      const url = isEditing 
        ? `/api/admin/categories/${categoryId}`
        : '/api/admin/categories';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEditing ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
        setTimeout(() => {
          router.push('/admin/categorias');
        }, 1000);
      } else {
        toast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error guardando categoría:', error);
      toast.error('Error de conexión al guardar categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateCategory = async () => {
    if (!isEditing) return;
    
    const duplicatedData = {
      ...formData,
      name: formData.name + ' (Copia)',
      slug: formData.slug + '-copia'
    };
    
    setFormData(duplicatedData);
    toast.success('Categoría duplicada. Modifica los datos y guarda.');
  };

  const iconOptions = [
    { value: '📁', label: '📁 Carpeta' },
    { value: '🏷️', label: '🏷️ Etiqueta' },
    { value: '📦', label: '📦 Caja' },
    { value: '🎯', label: '🎯 Objetivo' },
    { value: '⭐', label: '⭐ Estrella' },
    { value: '💎', label: '💎 Diamante' },
    { value: '🔥', label: '🔥 Fuego' },
    { value: '🚀', label: '🚀 Cohete' },
    { value: '💡', label: '💡 Bombilla' },
    { value: '🎨', label: '🎨 Arte' },
    { value: '📚', label: '📚 Libros' },
    { value: '👕', label: '👕 Ropa' },
    { value: '🏠', label: '🏠 Hogar' },
    { value: '⚽', label: '⚽ Deportes' },
    { value: '🎮', label: '🎮 Juegos' },
    { value: '📱', label: '📱 Tecnología' },
    { value: '🍎', label: '🍎 Comida' },
    { value: '🌟', label: '🌟 Premium' }
  ];

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="ml-4 text-gray-600">Cargando categoría...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? `Editar: ${formData.name}` : 'Nueva Categoría'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header con acciones */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin/categorias')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver a categorías
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDuplicateCategory}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  📄 Duplicar categoría
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
                  isEditing ? 'Actualizar Categoría' : 'Crear Categoría'
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
                    Nombre de la categoría *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre de la categoría"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug * <span className="text-xs text-gray-500">(URL amigable)</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                      /categorias/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                      className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.slug ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="slug-de-la-categoria"
                    />
                  </div>
                  {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría padre
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => handleInputChange('parent_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Sin categoría padre (Principal)</option>
                    {parentCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona una categoría padre para crear una subcategoría
                  </p>
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
                    <option value="active">🟢 Activa</option>
                    <option value="inactive">⚫ Inactiva</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Descripción de la categoría..."
                />
              </div>
            </div>

            {/* Imagen y apariencia */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🎨 Imagen y Apariencia</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen de la categoría
                  </label>
                  
                  {formData.image_url ? (
                    <div className="space-y-3">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={formData.image_url}
                          alt={formData.name}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          🗑️
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="URL de la imagen"
                        value={formData.image_url}
                        onChange={(e) => handleInputChange('image_url', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
                        <label className="flex flex-col items-center justify-center cursor-pointer">
                          <div className="text-center">
                            {uploading ? (
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                            ) : (
                              <>
                                <svg className="w-8 h-8 mb-4 text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">Click para subir</span> o arrastra
                                </p>
                                <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files[0])}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      <div className="text-center text-sm text-gray-500">o</div>
                      <input
                        type="text"
                        placeholder="URL de la imagen"
                        value={formData.image_url}
                        onChange={(e) => handleInputChange('image_url', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>

                {/* Icono y color */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icono
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => handleInputChange('icon', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Sin icono</option>
                      {iconOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color de la categoría
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.color || '#3B82F6'}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="#3B82F6"
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.color ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Color para identificar la categoría en la interfaz
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orden de visualización
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => handleInputChange('sort_order', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Menor número = mayor prioridad
                    </p>
                  </div>
                </div>
              </div>
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
                        judaicabreslovcolombia.com/categorias/{formData.slug}
                      </div>
                      <div className="text-gray-600 mt-1">
                        {formData.meta_description || formData.description}
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
                    Categoría destacada
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
                    Estado de la categoría
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">🟢 Activa (Visible en tienda)</option>
                    <option value="inactive">⚫ Inactiva (Oculta)</option>
                  </select>
                </div>

                {isEditing && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>ID: {categoryId}</p>
                    <p>Creado: {new Date().toLocaleDateString()}</p>
                    <p>Última actualización: {new Date().toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Jerarquía */}
            {hierarchy.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🌳 Jerarquía</h3>
                
                <div className="space-y-2">
                  {hierarchy.map((item, index) => (
                    <div key={index} className="flex items-center text-sm">
                      {index > 0 && <span className="text-gray-400 mr-2">→</span>}
                      <span className={index === hierarchy.length - 1 ? 'font-medium text-primary-600' : 'text-gray-600'}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview de la categoría */}
            {(formData.name || formData.description) && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">👁️ Vista Previa</h3>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {formData.image_url && (
                    <div className="aspect-video relative mb-3 overflow-hidden rounded-md bg-white">
                      <Image
                        src={formData.image_url}
                        alt={formData.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {formData.icon && (
                        <span className="text-lg">{formData.icon}</span>
                      )}
                      <h4 className="font-medium text-gray-900 leading-tight">
                        {formData.name || 'Nombre de la categoría'}
                      </h4>
                      {formData.featured && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          ⭐ Destacada
                        </span>
                      )}
                    </div>
                    
                    {formData.description && (
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {formData.description}
                      </div>
                    )}

                    {formData.color && (
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: formData.color }}
                        ></div>
                        <span className="text-xs text-gray-500">Color de categoría</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href={`/categorias/${formData.slug}`}
                    target="_blank"
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Ver en la tienda →
                  </Link>
                </div>
              </div>
            )}

            {/* Productos recientes (solo en edición) */}
            {isEditing && recentProducts.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📦 Productos Recientes</h3>
                
                <div className="space-y-3">
                  {recentProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                      <div className="w-10 h-10 relative rounded overflow-hidden bg-gray-200">
                        {product.featured_image ? (
                          <Image
                            src={product.featured_image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${product.price?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-center">
                  <Link
                    href={`/admin/productos?category=${categoryId}`}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Ver todos los productos →
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
                    handleInputChange('meta_description', formData.description.substring(0, 160));
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
                    onClick={handleDuplicateCategory}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    📄 Duplicar categoría
                  </button>
                )}

                <Link
                  href="/admin/productos/nuevo"
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  ➕ Agregar producto a esta categoría
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default CategoryForm;