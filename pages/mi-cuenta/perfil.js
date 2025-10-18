// pages/mi-cuenta/perfil.js - VERSIÓN MEJORADA CON DISEÑO MODERNO
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import withClientAuth from '../../components/withClientAuth';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

function MiPerfilPage({ user }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    // Información personal
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    firstName: '',
    lastName: '',
    
    // Preferencias
    newsletter: true,
    smsNotifications: false,
    emailNotifications: true,
    language: 'es',
    
    // Seguridad
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const router = useRouter();

  useEffect(() => {
    // Cargar datos del usuario del contexto
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        // Las preferencias se cargarán desde la API
      }));
      
      // Cargar preferencias adicionales
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            newsletter: data.data.newsletter ?? true,
            smsNotifications: data.data.smsNotifications ?? false,
            emailNotifications: data.data.emailNotifications ?? true,
            language: data.data.language ?? 'es'
          }));
        }
      }
    } catch (error) {
      console.error('Error cargando preferencias:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (activeTab === 'personal') {
      if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
      if (!formData.email.trim()) newErrors.email = 'El email es requerido';
      if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email no válido';
      if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        newErrors.phone = 'Formato de teléfono no válido';
      }
    }

    if (activeTab === 'security' && formData.newPassword) {
      if (!formData.currentPassword) newErrors.currentPassword = 'Contraseña actual requerida';
      if (formData.newPassword.length < 6) newErrors.newPassword = 'Mínimo 6 caracteres';
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.newPassword)) {
        newErrors.newPassword = 'Debe incluir mayúsculas y minúsculas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      let endpoint = '/api/user/profile';
      let payload = {};

      if (activeTab === 'personal') {
        endpoint = '/api/user/profile';
        payload = {
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          firstName: formData.firstName.trim() || null,
          lastName: formData.lastName.trim() || null
        };
      } else if (activeTab === 'preferences') {
        endpoint = '/api/user/preferences';
        payload = {
          newsletter: formData.newsletter,
          smsNotifications: formData.smsNotifications,
          emailNotifications: formData.emailNotifications,
          language: formData.language
        };
      } else if (activeTab === 'security') {
        endpoint = '/api/user/change-password';
        payload = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        };
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        if (activeTab === 'personal') {
          toast.success('Información personal actualizada');
        } else if (activeTab === 'preferences') {
          toast.success('Preferencias guardadas');
        } else if (activeTab === 'security') {
          toast.success('Contraseña actualizada');
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        }
      } else {
        toast.error(data.message || 'Error al guardar los cambios');
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      id: 'personal',
      name: 'Información Personal',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'preferences',
      name: 'Preferencias',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'security',
      name: 'Seguridad',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      color: 'from-green-500 to-emerald-600'
    }
  ];

  return (
    <Layout
      title="Mi Perfil | Mi Cuenta | Judaica Breslov Colombia"
      description="Gestiona tu información personal, preferencias y configuración de seguridad"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Header compacto */}
        <div className="bg-white shadow-sm border-b border-gray-200/60 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
              <Link href="/" className="hover:text-blue-600 transition-colors duration-200 font-medium">
                Inicio
              </Link>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/mi-cuenta" className="hover:text-blue-600 transition-colors duration-200 font-medium">
                Mi Cuenta
              </Link>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-semibold">Mi Perfil</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Mi Perfil
                </h1>
              </div>
              
              <Link
                href="/mi-cuenta"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Panel
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Sidebar con avatar y tabs mejorado */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden sticky top-6">
                {/* Avatar section mejorado */}
                <div className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-100/50">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-blue-100">
                    <span className="text-white font-bold text-2xl">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{user?.name || 'Usuario'}</h3>
                  <p className="text-sm text-gray-600 mb-4">{user?.email || 'email@ejemplo.com'}</p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                    Cambiar Foto
                  </button>
                </div>
                
                {/* Tabs navigation mejorada */}
                <nav className="p-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left mb-2 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        activeTab === tab.id 
                          ? `bg-gradient-to-br ${tab.color} shadow-lg` 
                          : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <svg className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                        </svg>
                      </div>
                      <span className="font-medium text-sm">{tab.name}</span>
                      {activeTab === tab.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Contenido principal mejorado */}
            <div className="lg:col-span-4">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50">
                
                {/* Información Personal */}
                {activeTab === 'personal' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-8"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        Información Personal
                      </h2>
                      <p className="text-gray-600">Actualiza tu información básica y de contacto</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            errors.name ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Tu nombre completo"
                        />
                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                          placeholder="tu@email.com"
                        />
                        <p className="text-sm text-gray-500 mt-1">El email no se puede cambiar</p>
                        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            errors.phone ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="+57 300 123 4567"
                        />
                        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ciudad
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Bogotá"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Dirección
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Calle 123 #45-67"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Nombre"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Apellido
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Apellido"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Preferencias */}
                {activeTab === 'preferences' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-8"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                        </div>
                        Preferencias
                      </h2>
                      <p className="text-gray-600">Configura tus preferencias de comunicación y idioma</p>
                    </div>

                    <div className="space-y-8">
                      {/* Notificaciones */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Notificaciones</h3>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900">Newsletter</h4>
                              <p className="text-sm text-gray-600">Recibe noticias sobre productos y ofertas especiales</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                name="newsletter"
                                checked={formData.newsletter}
                                onChange={handleInputChange}
                                className="sr-only peer"
                              />
                              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900">Notificaciones por Email</h4>
                              <p className="text-sm text-gray-600">Recibe actualizaciones sobre tus pedidos por email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                name="emailNotifications"
                                checked={formData.emailNotifications}
                                onChange={handleInputChange}
                                className="sr-only peer"
                              />
                              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900">Notificaciones por SMS</h4>
                              <p className="text-sm text-gray-600">Recibe notificaciones importantes por mensaje de texto</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                name="smsNotifications"
                                checked={formData.smsNotifications}
                                onChange={handleInputChange}
                                className="sr-only peer"
                              />
                              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Idioma */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Idioma</h3>
                        <select
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                          className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="es">Español</option>
                          <option value="en">English</option>
                          <option value="he">עברית (Hebrew)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Seguridad */}
                {activeTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-8"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        Seguridad
                      </h2>
                      <p className="text-gray-600">Cambiar contraseña y configuración de seguridad</p>
                    </div>

                    <div className="space-y-8">
                      {/* Cambiar contraseña */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Cambiar Contraseña</h3>
                        <div className="grid grid-cols-1 gap-6 max-w-md">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Contraseña Actual
                            </label>
                            <input
                              type="password"
                              name="currentPassword"
                              value={formData.currentPassword}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                                errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Contraseña actual"
                            />
                            {errors.currentPassword && <p className="text-red-600 text-sm mt-1">{errors.currentPassword}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Nueva Contraseña
                            </label>
                            <input
                              type="password"
                              name="newPassword"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                                errors.newPassword ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Nueva contraseña"
                            />
                            {errors.newPassword && <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Confirmar Nueva Contraseña
                            </label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Confirmar nueva contraseña"
                            />
                            {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Información de seguridad */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                        <div className="flex">
                          <svg className="w-6 h-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <div className="ml-4">
                            <h3 className="text-sm font-semibold text-green-800">Consejos de Seguridad</h3>
                            <div className="mt-2 text-sm text-green-700">
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Usa una contraseña de al menos 6 caracteres</li>
                                <li>Incluye mayúsculas, minúsculas, números y símbolos</li>
                                <li>No compartas tu contraseña con nadie</li>
                                <li>Cambia tu contraseña regularmente</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Botones de acción mejorados */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-200/60 flex items-center justify-between rounded-b-2xl">
                  <div className="text-sm text-gray-600">
                    * Campos obligatorios
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        }));
                        setErrors({});
                      }}
                      className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center font-semibold shadow-lg hover:shadow-xl"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        'Guardar Cambios'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withClientAuth(MiPerfilPage);