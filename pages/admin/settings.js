// /pages/admin/settings.js
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

// --- Componentes de UI Reutilizables ---

const TabButton = ({ isActive, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      isActive
        ? 'border-primary-600 text-primary-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

const InputField = ({ label, name, value, onChange, type = 'text', placeholder = '', description = '' }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      id={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
    />
    {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
  </div>
);

const ToggleSwitch = ({ label, name, checked, onChange, description = '' }) => (
    <div className="flex items-center justify-between">
      <div>
        <span className="block text-sm font-medium text-gray-700">{label}</span>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <label htmlFor={name} className="inline-flex relative items-center cursor-pointer">
        <input type="checkbox" name={name} id={name} className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
      </label>
    </div>
);


// --- Componente Principal de la Página de Configuración ---

const SettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Configuración guardada exitosamente.', 'success');
      } else {
        throw new Error(data.message || 'Error al guardar.');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) return <AdminLayout title="Cargando..."><div>Cargando configuración...</div></AdminLayout>;

  return (
    <AdminLayout title="Configuración del Sitio">
      {notification.show && (
        <div className={`p-4 mb-4 text-sm rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Configuración del Sitio</h1>
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <TabButton isActive={activeTab === 'general'} onClick={() => setActiveTab('general')}>General</TabButton>
            <TabButton isActive={activeTab === 'store'} onClick={() => setActiveTab('store')}>Tienda</TabButton>
            <TabButton isActive={activeTab === 'seo'} onClick={() => setActiveTab('seo')}>SEO y Redes</TabButton>
            <TabButton isActive={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')}>Mantenimiento</TabButton>
          </nav>
        </div>
        
        <div className="bg-white p-6 rounded-b-lg rounded-r-lg shadow-soft">
          {/* Pestaña General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <InputField label="Nombre del Sitio" name="site_name" value={settings.site_name} onChange={handleChange} />
              <InputField label="Descripción Corta del Sitio" name="site_description" value={settings.site_description} onChange={handleChange} description="Aparecerá en los motores de búsqueda." />
              <InputField label="Email de Contacto" name="contact_email" value={settings.contact_email} onChange={handleChange} type="email" />
              <InputField label="Teléfono de Contacto" name="contact_phone" value={settings.contact_phone} onChange={handleChange} />
            </div>
          )}

          {/* Pestaña Tienda */}
          {activeTab === 'store' && (
            <div className="space-y-6">
              <InputField label="Moneda (ej. COP, USD)" name="currency" value={settings.currency} onChange={handleChange} />
              <InputField label="Tasa de Impuesto (%)" name="tax_rate" value={settings.tax_rate} onChange={handleChange} type="number" description="Introduce solo el número. Ej: 19" />
              <InputField label="Costo de Envío Base" name="base_shipping_cost" value={settings.base_shipping_cost} onChange={handleChange} type="number" />
              <InputField label="Monto para Envío Gratuito" name="free_shipping_threshold" value={settings.free_shipping_threshold} onChange={handleChange} type="number" description="El envío será gratuito para órdenes que superen este monto." />
              <InputField label="Umbral de Stock Bajo" name="low_stock_threshold" value={settings.low_stock_threshold} onChange={handleChange} type="number" description="Recibirás una alerta cuando el stock de un producto sea igual o menor a este número." />
            </div>
          )}

          {/* Pestaña SEO y Redes */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <InputField label="URL de Facebook" name="social_facebook" value={settings.social_facebook} onChange={handleChange} />
              <InputField label="URL de Instagram" name="social_instagram" value={settings.social_instagram} onChange={handleChange} />
              <InputField label="URL de WhatsApp" name="social_whatsapp" value={settings.social_whatsapp} onChange={handleChange} description="Ej: https://wa.me/573001234567" />
            </div>
          )}

          {/* Pestaña Mantenimiento */}
          {activeTab === 'maintenance' && (
             <div className="space-y-6">
              <ToggleSwitch 
                label="Modo Mantenimiento" 
                name="maintenance_mode" 
                checked={!!settings.maintenance_mode} 
                onChange={handleChange}
                description="Si se activa, solo los administradores podrán ver el sitio web."
              />
            </div>
          )}
        </div>
      </form>
    </AdminLayout>
  );
};

export default SettingsPage;