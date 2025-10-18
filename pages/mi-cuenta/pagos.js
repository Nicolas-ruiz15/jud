// pages/mi-cuenta/pagos.js - Gestión de métodos de pago con diseño moderno
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import withClientAuth from '../../components/withClientAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

function MisPagosPage({ user }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    type: 'card',
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cardType: '',
    bankName: '',
    accountType: 'savings',
    accountNumber: '',
    accountName: '',
    isDefault: false,
    nickname: ''
  });
  const [errors, setErrors] = useState({});

  const router = useRouter();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/user/payment-methods', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.data);
      } else {
        toast.error('Error cargando métodos de pago');
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
      toast.error('Error de conexión');
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    if (name === 'cardNumber') {
      processedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (processedValue.length > 19) {
        processedValue = processedValue.substring(0, 19);
      }
    }

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

  const openModal = (method = null) => {
    if (method) {
      setFormData({
        ...method,
        cardNumber: method.cardNumber || '',
        accountNumber: method.accountNumber || ''
      });
      setEditingMethod(method);
    } else {
      setFormData({
        id: null,
        type: 'card',
        cardNumber: '',
        cardName: user?.name || '',
        expiryMonth: '',
        expiryYear: '',
        cardType: '',
        bankName: '',
        accountType: 'savings',
        accountNumber: '',
        accountName: user?.name || '',
        isDefault: paymentMethods.length === 0,
        nickname: ''
      });
      setEditingMethod(null);
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMethod(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = editingMethod 
        ? `/api/user/payment-methods/${editingMethod.id}`
        : '/api/user/payment-methods';
      
      const method = editingMethod ? 'PUT' : 'POST';

      let payload = {
        type: formData.type,
        nickname: formData.nickname.trim(),
        isDefault: formData.isDefault
      };

      if (formData.type === 'card') {
        payload = {
          ...payload,
          cardName: formData.cardName.trim(),
          expiryMonth: formData.expiryMonth,
          expiryYear: formData.expiryYear
        };

        if (!editingMethod) {
          payload.cardNumber = formData.cardNumber.replace(/\s/g, '');
        }
      } else if (formData.type === 'bank_account') {
        payload = {
          ...payload,
          bankName: formData.bankName.trim(),
          accountType: formData.accountType,
          accountName: formData.accountName.trim()
        };

        if (!editingMethod) {
          payload.accountNumber = formData.accountNumber.trim();
        }
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingMethod ? 'Método de pago actualizado' : 'Método de pago agregado');
        await loadPaymentMethods();
        closeModal();
      } else {
        toast.error(data.message || 'Error al guardar método de pago');
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

  const handleDelete = async (methodId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de pago?')) return;

    setDeletingId(methodId);
    try {
      const response = await fetch(`/api/user/payment-methods/${methodId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Método de pago eliminado');
        setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
      } else {
        toast.error(data.message || 'Error al eliminar método de pago');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      const response = await fetch(`/api/user/payment-methods/${methodId}/set-default`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Método de pago predeterminado actualizado');
        setPaymentMethods(prev => prev.map(method => ({
          ...method,
          isDefault: method.id === methodId
        })));
      } else {
        toast.error(data.message || 'Error al actualizar método predeterminado');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const getCardColor = (cardType) => {
    const colors = {
      visa: 'from-blue-600 to-blue-800',
      mastercard: 'from-red-600 to-orange-600',
      amex: 'from-green-600 to-green-800'
    };
    return colors[cardType] || 'from-gray-600 to-gray-800';
  };

  const getCardIcon = (cardType) => {
    return (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );
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
      title="Métodos de Pago | Mi Cuenta | Judaica Breslov Colombia"
      description="Gestiona tus métodos de pago y tarjetas"
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
              <span className="text-gray-900 font-semibold">Métodos de Pago</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  Métodos de Pago
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona tus tarjetas y cuentas bancarias
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => openModal()}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                  </svg>
                  Agregar método
                </button>
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
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Sidebar mejorado */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden sticky top-6">
                {/* Avatar section */}
                <div className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-100/50">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-green-100">
                    <span className="text-white font-bold text-2xl">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{user?.name || 'Usuario'}</h3>
                  <p className="text-sm text-gray-600 mb-4">{paymentMethods.length} métodos guardados</p>
                </div>
                
                {/* Information section */}
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Seguridad</h4>
                        <p className="text-gray-600 text-sm">Tus datos están encriptados y seguros</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Pagos Rápidos</h4>
                        <p className="text-gray-600 text-sm">Compra más rápido con métodos guardados</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Múltiples Métodos</h4>
                        <p className="text-gray-600 text-sm">Tarjetas y cuentas bancarias</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de métodos de pago */}
            <div className="lg:col-span-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 p-8">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-10 bg-gray-200 rounded-xl"></div>
                            <div>
                              <div className="h-5 w-20 bg-gray-200 rounded-lg mb-2"></div>
                              <div className="h-4 w-32 bg-gray-200 rounded-lg"></div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 w-full bg-gray-200 rounded-lg"></div>
                          <div className="h-4 w-2/3 bg-gray-200 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : paymentMethods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paymentMethods.map((method, index) => (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border-2 transition-all duration-300 overflow-hidden ${
                        method.isDefault 
                          ? 'border-green-500 ring-2 ring-green-200' 
                          : 'border-gray-100 hover:border-gray-300 hover:shadow-2xl'
                      }`}
                    >
                      {method.isDefault && (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-4 py-2 text-center">
                          Método Predeterminado
                        </div>
                      )}
                      
                      <div className="p-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className={`w-16 h-10 rounded-xl bg-gradient-to-br ${
                              method.type === 'card' 
                                ? getCardColor(method.cardType)
                                : 'from-gray-600 to-gray-800'
                            } flex items-center justify-center shadow-lg`}>
                              {method.type === 'card' ? getCardIcon(method.cardType) : (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">{method.nickname}</h3>
                              <p className="text-sm text-gray-600">
                                {method.type === 'card' 
                                  ? `${method.cardType?.toUpperCase()} •••• ${method.lastFour}`
                                  : `${method.bankName} •••• ${method.lastFour}`
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openModal(method)}
                              className="p-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(method.id)}
                              disabled={deletingId === method.id}
                              className="p-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Eliminar"
                            >
                              {deletingId === method.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Detalles del método */}
                        <div className="space-y-3 text-sm mb-6">
                          {method.type === 'card' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Titular:</span>
                                <span className="font-semibold text-gray-900">{method.cardName}</span>
                              </div>
                              {method.expiryMonth && method.expiryYear && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Vence:</span>
                                  <span className="font-semibold text-gray-900">{method.expiryMonth}/{method.expiryYear}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Titular:</span>
                                <span className="font-semibold text-gray-900">{method.accountName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tipo:</span>
                                <span className="font-semibold text-gray-900">{method.accountType === 'savings' ? 'Ahorros' : 'Corriente'}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Acciones */}
                        {!method.isDefault && (
                          <div className="pt-6 border-t border-gray-200/60">
                            <button
                              onClick={() => handleSetDefault(method.id)}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                            >
                              Establecer como predeterminado
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 p-12 text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No tienes métodos de pago guardados
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    Agrega una tarjeta o cuenta bancaria para pagos más rápidos
                  </p>
                  <button
                    onClick={() => openModal()}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Agregar Primer Método
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de agregar/editar método de pago - versión moderna */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 transition-opacity bg-gray-900/80 backdrop-blur-sm"
                  onClick={closeModal}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="inline-block w-full max-w-2xl p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-gray-200/50"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {editingMethod ? 'Editar Método de Pago' : 'Agregar Método de Pago'}
                        </h3>
                        <p className="text-gray-600">
                          {editingMethod ? 'Actualiza la información del método' : 'Agrega un nuevo método de pago'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de método */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-4">
                        Tipo de Método
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: 'card' }))}
                          className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 ${
                            formData.type === 'card'
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 shadow-lg'
                              : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              formData.type === 'card' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gray-200'
                            }`}>
                              <svg className={`w-6 h-6 ${formData.type === 'card' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                            <div>
                              <span className="font-semibold">Tarjeta</span>
                              <p className="text-sm text-gray-600">Tarjeta de crédito o débito</p>
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: 'bank_account' }))}
                          className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 ${
                            formData.type === 'bank_account'
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 shadow-lg'
                              : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              formData.type === 'bank_account' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gray-200'
                            }`}>
                              <svg className={`w-6 h-6 ${formData.type === 'bank_account' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div>
                              <span className="font-semibold">Cuenta Bancaria</span>
                              <p className="text-sm text-gray-600">Cuenta de ahorros o corriente</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Nombre del método */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre del Método *
                      </label>
                      <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                          errors.nickname ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Tarjeta Principal, Cuenta Ahorros"
                      />
                      {errors.nickname && <p className="text-red-600 text-sm mt-1">{errors.nickname}</p>}
                    </div>

                    {/* Campos específicos según el tipo */}
                    {formData.type === 'card' ? (
                      <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
                        <h4 className="font-semibold text-blue-900 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Información de la Tarjeta
                        </h4>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Número de Tarjeta *
                          </label>
                          <input
                            type="text"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            disabled={!!editingMethod}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                              errors.cardNumber ? 'border-red-300' : 'border-gray-300'
                            } ${editingMethod ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="1234 5678 9012 3456"
                            maxLength="19"
                          />
                          {editingMethod && (
                            <p className="text-sm text-gray-500 mt-1">
                              El número de tarjeta no se puede modificar por seguridad
                            </p>
                          )}
                          {errors.cardNumber && <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre en la Tarjeta *
                          </label>
                          <input
                            type="text"
                            name="cardName"
                            value={formData.cardName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                              errors.cardName ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Nombre como aparece en la tarjeta"
                          />
                          {errors.cardName && <p className="text-red-600 text-sm mt-1">{errors.cardName}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Mes de Vencimiento *
                            </label>
                            <select
                              name="expiryMonth"
                              value={formData.expiryMonth}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                errors.expiryMonth ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Mes</option>
                              {months.map(month => (
                                <option key={month.value} value={month.value}>
                                  {month.value} - {month.label}
                                </option>
                              ))}
                            </select>
                            {errors.expiryMonth && <p className="text-red-600 text-sm mt-1">{errors.expiryMonth}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Año de Vencimiento *
                            </label>
                            <select
                              name="expiryYear"
                              value={formData.expiryYear}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                errors.expiryYear ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Año</option>
                              {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                            {errors.expiryYear && <p className="text-red-600 text-sm mt-1">{errors.expiryYear}</p>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200/50">
                        <h4 className="font-semibold text-purple-900 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Información de la Cuenta
                        </h4>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Banco *
                          </label>
                          <select
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                              errors.bankName ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Selecciona un banco</option>
                            {bancos.map(banco => (
                              <option key={banco} value={banco}>{banco}</option>
                            ))}
                          </select>
                          {errors.bankName && <p className="text-red-600 text-sm mt-1">{errors.bankName}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tipo de Cuenta
                          </label>
                          <select
                            name="accountType"
                            value={formData.accountType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="savings">Ahorros</option>
                            <option value="checking">Corriente</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Número de Cuenta *
                          </label>
                          <input
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleInputChange}
                            disabled={!!editingMethod}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                              errors.accountNumber ? 'border-red-300' : 'border-gray-300'
                            } ${editingMethod ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Número de cuenta"
                          />
                          {editingMethod && (
                            <p className="text-sm text-gray-500 mt-1">
                              El número de cuenta no se puede modificar por seguridad
                            </p>
                          )}
                          {errors.accountNumber && <p className="text-red-600 text-sm mt-1">{errors.accountNumber}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Titular de la Cuenta *
                          </label>
                          <input
                            type="text"
                            name="accountName"
                            value={formData.accountName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                              errors.accountName ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Nombre del titular"
                          />
                          {errors.accountName && <p className="text-red-600 text-sm mt-1">{errors.accountName}</p>}
                        </div>
                      </div>
                    )}

                    {/* Método predeterminado */}
                    <div className="flex items-center">
                      <input
                        id="isDefault"
                        name="isDefault"
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isDefault" className="ml-3 block text-sm font-medium text-gray-700">
                        Usar como método predeterminado
                      </label>
                    </div>

                    {/* Nota de seguridad */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                      <div className="flex">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-semibold text-green-800">Información Segura</h3>
                          <p className="mt-1 text-sm text-green-700">
                            Tus datos financieros son encriptados y almacenados de forma segura.
                            Solo guardamos información necesaria para procesar pagos.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200/60">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center font-semibold shadow-lg hover:shadow-xl"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {editingMethod ? 'Actualizar Método' : 'Agregar Método'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default withClientAuth(MisPagosPage);