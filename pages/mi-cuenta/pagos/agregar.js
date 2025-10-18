// pages/mi-cuenta/pagos/agregar.js - Página independiente para agregar método de pago
import { useState } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import withClientAuth from '../../../components/withClientAuth';
import { toast } from 'react-hot-toast';

function AgregarMetodoPagoPage({ user }) {
  const [formData, setFormData] = useState({
    type: 'card',
    nickname: '',
    cardNumber: '',
    cardName: user?.name || '',
    expiryMonth: '',
    expiryYear: '',
    bankName: '',
    accountType: 'savings',
    accountNumber: '',
    accountName: user?.name || '',
    isDefault: false
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    // Formatear número de tarjeta
    if (name === 'cardNumber') {
      processedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (processedValue.length > 19) {
        processedValue = processedValue.substring(0, 19);
      }
    }

    // Detectar tipo de tarjeta
    if (name === 'cardNumber') {
      const cleanNumber = value.replace(/\s/g, '');
      let cardType = '';
      
      if (cleanNumber.startsWith('4')) cardType = 'visa';
      else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) cardType = 'mastercard';
      else if (cleanNumber.startsWith('3')) cardType = 'amex';
      
      setFormData(prev => ({
        ...prev,
        cardType,
        [name]: processedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : processedValue
      }));
    }
    
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

    if (!formData.nickname.trim()) newErrors.nickname = 'El nombre es requerido';

    if (formData.type === 'card') {
      const cleanCardNumber = formData.cardNumber.replace(/\s/g, '');
      if (!cleanCardNumber) {
        newErrors.cardNumber = 'El número de tarjeta es requerido';
      } else if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
        newErrors.cardNumber = 'Número de tarjeta inválido';
      }
      
      if (!formData.cardName.trim()) newErrors.cardName = 'El nombre en la tarjeta es requerido';
      if (!formData.expiryMonth) newErrors.expiryMonth = 'El mes de vencimiento es requerido';
      if (!formData.expiryYear) newErrors.expiryYear = 'El año de vencimiento es requerido';
      
      // Validar fecha de vencimiento
      if (formData.expiryMonth && formData.expiryYear) {
        const now = new Date();
        const expiry = new Date(formData.expiryYear, formData.expiryMonth - 1);
        if (expiry <= now) {
          newErrors.expiryMonth = 'La tarjeta está vencida';
        }
      }
    } else if (formData.type === 'bank_account') {
      if (!formData.bankName.trim()) newErrors.bankName = 'El banco es requerido';
      if (!formData.accountNumber.trim()) newErrors.accountNumber = 'El número de cuenta es requerido';
      if (!formData.accountName.trim()) newErrors.accountName = 'El nombre de la cuenta es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      let payload = {
        type: formData.type,
        nickname: formData.nickname.trim(),
        isDefault: formData.isDefault
      };

      if (formData.type === 'card') {
        payload = {
          ...payload,
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          cardName: formData.cardName.trim(),
          expiryMonth: formData.expiryMonth,
          expiryYear: formData.expiryYear
        };
      } else if (formData.type === 'bank_account') {
        payload = {
          ...payload,
          bankName: formData.bankName.trim(),
          accountType: formData.accountType,
          accountNumber: formData.accountNumber.trim(),
          accountName: formData.accountName.trim()
        };
      }

      const response = await fetch('/api/user/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Método de pago agregado exitosamente');
        router.push('/mi-cuenta/pagos');
      } else {
        toast.error(data.message || 'Error al agregar método de pago');
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

  const bancos = [
    'Bancolombia', 'Banco de Bogotá', 'Banco Popular', 'BBVA Colombia',
    'Banco Davivienda', 'Banco AV Villas', 'Banco Caja Social',
    'Banco Agrario', 'Banco de Occidente', 'Citibank Colombia',
    'Banco Falabella', 'Banco Pichincha', 'Banco Santander',
    'Banco GNB Sudameris', 'Banco Itaú', 'Scotiabank Colpatria'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: new Date(0, i).toLocaleString('es', { month: 'long' })
  }));

  return (
    <Layout
      title="Agregar Método de Pago | Mi Cuenta | Judaica Breslov Colombia"
      description="Agrega un nuevo método de pago"
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
              <Link href="/mi-cuenta/pagos" className="hover:text-blue-600">Métodos de Pago</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Agregar Método</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Agregar Método de Pago</h1>
                <p className="text-gray-600 mt-1">
                  Agrega una nueva tarjeta o cuenta bancaria
                </p>
              </div>
              
              <Link
                href="/mi-cuenta/pagos"
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
              
              {/* Tipo de método */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Tipo de Método de Pago
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'card' }))}
                    className={`p-6 border-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                      formData.type === 'card'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-5xl mb-3">💳</div>
                    <div className="text-xl font-semibold">Tarjeta</div>
                    <div className="text-sm text-gray-600 mt-1">Crédito o Débito</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'bank_account' }))}
                    className={`p-6 border-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                      formData.type === 'bank_account'
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-lg'
                        : 'border-gray-300 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-5xl mb-3">🏛️</div>
                    <div className="text-xl font-semibold">Cuenta Bancaria</div>
                    <div className="text-sm text-gray-600 mt-1">Ahorros o Corriente</div>
                  </button>
                </div>
              </div>

              {/* Nombre del método */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre para este método *
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.nickname ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Mi tarjeta principal, Cuenta de ahorros"
                />
                {errors.nickname && <p className="text-red-600 font-medium mt-2">{errors.nickname}</p>}
              </div>

              {/* Campos de tarjeta */}
              {formData.type === 'card' && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-6">Información de la Tarjeta</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Tarjeta *
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                      {errors.cardNumber && <p className="text-red-600 font-medium mt-1">{errors.cardNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre en la Tarjeta *
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.cardName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Como aparece en la tarjeta"
                      />
                      {errors.cardName && <p className="text-red-600 font-medium mt-1">{errors.cardName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mes *
                        </label>
                        <select
                          name="expiryMonth"
                          value={formData.expiryMonth}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Mes</option>
                          {months.map(month => (
                            <option key={month.value} value={month.value}>
                              {month.value} - {month.label}
                            </option>
                          ))}
                        </select>
                        {errors.expiryMonth && <p className="text-red-600 font-medium mt-1">{errors.expiryMonth}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Año *
                        </label>
                        <select
                          name="expiryYear"
                          value={formData.expiryYear}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.expiryYear ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Año</option>
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        {errors.expiryYear && <p className="text-red-600 font-medium mt-1">{errors.expiryYear}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos de banco */}
              {formData.type === 'bank_account' && (
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-6">Información Bancaria</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banco *
                      </label>
                      <select
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.bankName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Selecciona tu banco</option>
                        {bancos.map(banco => (
                          <option key={banco} value={banco}>{banco}</option>
                        ))}
                      </select>
                      {errors.bankName && <p className="text-red-600 font-medium mt-1">{errors.bankName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Cuenta
                      </label>
                      <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="savings">Cuenta de Ahorros</option>
                        <option value="checking">Cuenta Corriente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Cuenta *
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Número de cuenta"
                      />
                      {errors.accountNumber && <p className="text-red-600 font-medium mt-1">{errors.accountNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titular de la Cuenta *
                      </label>
                      <input
                        type="text"
                        name="accountName"
                        value={formData.accountName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.accountName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nombre del titular"
                      />
                      {errors.accountName && <p className="text-red-600 font-medium mt-1">{errors.accountName}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Predeterminado */}
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
                    Usar como método de pago predeterminado
                  </span>
                </label>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <Link
                  href="/mi-cuenta/pagos"
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
                      💾 Agregar Método
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

export default withClientAuth(AgregarMetodoPagoPage);