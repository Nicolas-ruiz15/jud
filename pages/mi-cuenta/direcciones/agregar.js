// pages/mi-cuenta/direcciones/agregar.js - Página independiente para agregar dirección
import { useState } from 'react';
<script src="/js/enhanced-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import withClientAuth from '../../../components/withClientAuth';
import { toast } from 'react-hot-toast';

function AgregarDireccionPage({ user }) {
  const [formData, setFormData] = useState({
    type: 'home',
    name: '',
    recipient: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: user?.city || '',
    department: '',
    postalCode: '',
    isDefault: false,
    instructions: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre de la dirección es requerido';
    if (!formData.recipient.trim()) newErrors.recipient = 'El destinatario es requerido';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!formData.address.trim()) newErrors.address = 'La dirección completa es requerida';
    if (!formData.city.trim()) newErrors.city = 'La ciudad es requerida';
    if (!formData.department.trim()) newErrors.department = 'El departamento es requerido';

    // Validar teléfono colombiano
    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'El teléfono debe tener 10 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        type: formData.type,
        name: formData.name.trim(),
        recipient: formData.recipient.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        department: formData.department.trim(),
        postalCode: formData.postalCode.trim() || null,
        isDefault: formData.isDefault,
        instructions: formData.instructions.trim() || null
      };

      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Dirección agregada exitosamente');
        router.push('/mi-cuenta/direcciones');
      } else {
        toast.error(data.message || 'Error al agregar dirección');
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const tiposDireccion = [
    { value: 'home', label: '🏠 Casa', description: 'Residencia personal' },
    { value: 'work', label: '🏢 Oficina', description: 'Lugar de trabajo' },
    { value: 'other', label: '📍 Otro', description: 'Otra dirección' }
  ];

  const departamentosColombia = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
    'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
    'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
    'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
    'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
    'Vaupés', 'Vichada'
  ];

  return (
    <Layout
      title="Agregar Dirección | Mi Cuenta | Judaica Breslov Colombia"
      description="Agrega una nueva dirección de entrega"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Link href="/" className="hover:text-blue-600">Inicio</Link>
              <span>/</span>
              <Link href="/mi-cuenta" className="hover:text-blue-600">Mi Cuenta</Link>
              <span>/</span>
              <Link href="/mi-cuenta/direcciones" className="hover:text-blue-600">Direcciones</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Agregar Dirección</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Agregar Nueva Dirección</h1>
                <p className="text-gray-600 mt-1">
                  Agrega una dirección de entrega para tus pedidos
                </p>
              </div>
              
              <Link
                href="/mi-cuenta/direcciones"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </Link>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
              
              {/* Tipo de dirección */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Tipo de Dirección
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tiposDireccion.map(tipo => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: tipo.value }))}
                      className={`p-4 border-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                        formData.type === tipo.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                          : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{tipo.label.split(' ')[0]}</div>
                      <div className="font-semibold">{tipo.label.split(' ').slice(1).join(' ')}</div>
                      <div className="text-xs text-gray-600 mt-1">{tipo.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Información básica */}
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-6">Información Básica</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Dirección *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Casa, Oficina, Casa de mis padres"
                    />
                    {errors.name && <p className="text-red-600 font-medium mt-2">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destinatario *
                      </label>
                      <input
                        type="text"
                        name="recipient"
                        value={formData.recipient}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.recipient ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nombre completo"
                      />
                      {errors.recipient && <p className="text-red-600 font-medium mt-1">{errors.recipient}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="3009291156"
                        maxLength="10"
                      />
                      {errors.phone && <p className="text-red-600 font-medium mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de ubicación */}
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-6">Ubicación</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección Completa *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Calle/Carrera/Avenida #123-45, Barrio, referencias adicionales"
                    />
                    {errors.address && <p className="text-red-600 font-medium mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Bogotá, Medellín, Cali..."
                      />
                      {errors.city && <p className="text-red-600 font-medium mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departamento *
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.department ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Selecciona departamento</option>
                        {departamentosColombia.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      {errors.department && <p className="text-red-600 font-medium mt-1">{errors.department}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal (Opcional)
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="110111"
                      maxLength="6"
                    />
                  </div>
                </div>
              </div>

              {/* Instrucciones adicionales */}
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Instrucciones Adicionales</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas para el Repartidor (Opcional)
                  </label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Ej: Timbre del apartamento 301, Preguntar por Juan, Casa color azul..."
                  />
                </div>
              </div>

              {/* Dirección predeterminada */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    id="isDefault"
                    name="isDefault"
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-lg font-medium text-gray-700">
                    Usar como dirección predeterminada
                  </span>
                </label>
                <p className="text-sm text-gray-600 mt-2 ml-8">
                  Esta será tu dirección por defecto para futuros pedidos
                </p>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <Link
                  href="/mi-cuenta/direcciones"
                  className="px-8 py-3 text-lg font-semibold text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 text-lg font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      📍 Agregar Dirección
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withClientAuth(AgregarDireccionPage);