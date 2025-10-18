// pages/payment/response.js - Página de respuesta para ePayco Standard (MODIFICADO)
import { useEffect, useState } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { useCart } from '../../context/CartContext'; // Importar useCart para limpiar el carrito
import { toast } from 'react-hot-toast'; // Importar toast para notificaciones

const PaymentResponse = () => {
  const router = useRouter();
  const { clearCart } = useCart(); // Obtener la función clearCart del contexto
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener parámetros de la URL que envía ePayco
    const handlePaymentResponse = async () => { // Convertir a async
      const urlParams = new URLSearchParams(window.location.search);
      const data = {};
      
      // ePayco Standard envía estos parámetros
      for (let [key, value] of urlParams.entries()) {
        data[key] = value;
      }
      
      console.log('📥 Respuesta de ePayco Standard:', data);
      setPaymentData(data);
      
      // Determinar estado del pago
      const status = determinePaymentStatus(data);
      setPaymentStatus(status);
      setIsLoading(false);
      
      // *** Lógica para enviar correo y limpiar carrito ***
      const orderIdFromEpayco = data.x_extra2 || data.extra2; // Obtener el order_id que enviamos a ePayco
      
      if (status === 'success' || status === 'pending') { // Si el pago es exitoso o pendiente
          // 1. Limpiar el carrito en el frontend
          clearCart(); 
          toast.success('¡Tu compra se ha completado exitosamente!');

          // 2. Enviar email de confirmación (llamando a tu API de backend)
          if (orderIdFromEpayco) {
              try {
                  const emailResponse = await fetch('/api/email/send-order-confirmation', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orderId: parseInt(orderIdFromEpayco, 10) }),
                  });
                  const emailResult = await emailResponse.json();
                  if (emailResult.success) {
                      console.log('Email de confirmación solicitado exitosamente.');
                  } else {
                      console.error('Error al solicitar el envío del email de confirmación:', emailResult.message);
                      toast.error('Error al enviar el email de confirmación.');
                  }
              } catch (error) {
                  console.error('Error de red al solicitar el envío del email:', error);
                  toast.error('Error de red al enviar el email de confirmación.');
              }
          }
      } else { // Pago fallido o error
          toast.error(data.x_response || 'Tu pago ha sido rechazado o fallido. Por favor, intenta de nuevo.');
          // No limpiamos el carrito si el pago falla, para que el usuario pueda reintentar.
      }
      // *** FIN Lógica para enviar correo y limpiar carrito ***

      // Redirigir después de mostrar información por 5 segundos
      setTimeout(() => {
        redirectToFinalPage(status, data);
      }, 5000);
    };

    if (router.isReady) {
      handlePaymentResponse();
    }
    // Asegurarse de que `clearCart` es una dependencia para el `useEffect`
  }, [router.isReady, clearCart]); 

  const determinePaymentStatus = (data) => {
    // Parámetros que puede enviar ePayco Standard
    const {
      x_ref_payco, // Usar x_ref_payco preferentemente
      x_transaction_state, // Estado numérico: 1=Aprobada, 2=Rechazada, 3=Pendiente, 4=Fallida
      x_response, // Mensaje de respuesta
      x_cod_response // Código de respuesta de ePayco
    } = data;

    if (!x_ref_payco) { // Si no hay referencia, algo salió mal
      return 'error';
    }

    // Priorizar el estado de la transacción (x_transaction_state)
    switch (x_transaction_state) {
      case '1': return 'success'; // Aprobada
      case '2': return 'failed'; // Rechazada
      case '3': return 'pending'; // Pendiente
      case '4': return 'failed'; // Fallida
      default:
        // Fallback usando códigos de respuesta si x_transaction_state no es claro
        if (x_cod_response === '1') return 'success';
        if (x_cod_response === '3') return 'pending';
        return 'failed'; // Cualquier otra cosa se considera fallida
    }
  };

  const redirectToFinalPage = (status, data) => {
    const ref = data.x_ref_payco || 'unknown'; // Usar x_ref_payco
    
    switch (status) {
      case 'success':
        router.push(`/payment/success?ref=${ref}`);
        break;
      case 'pending':
        router.push(`/payment/pending?ref=${ref}`);
        break;
      case 'failed':
      case 'error':
      default:
        router.push(`/payment/error?ref=${ref}`);
        break;
    }
  };

  const getStatusInfo = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          icon: '✅',
          title: 'Pago Exitoso',
          message: 'Tu pago ha sido procesado correctamente',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'pending':
        return {
          icon: '⏳',
          title: 'Pago Pendiente',
          message: 'Tu pago está siendo verificado',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'failed':
        return {
          icon: '❌',
          title: 'Pago Rechazado',
          message: 'Tu pago no pudo ser procesado',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'error':
        return {
          icon: '⚠️',
          title: 'Error de Pago',
          message: 'Ocurrió un error durante el proceso',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: '🔄',
          title: 'Procesando',
          message: 'Verificando el estado de tu pago...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Procesando respuesta del pago...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Respuesta de Pago - Judaica Breslov Colombia</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            
            {/* Status Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{statusInfo.icon}</div>
              <h1 className={`text-3xl font-bold ${statusInfo.color} mb-2`}>
                {statusInfo.title}
              </h1>
              <p className="text-gray-600 text-lg">
                {statusInfo.message}
              </p>
            </div>

            {/* Detalles del pago */}
            {paymentData && (
              <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-6 mb-6`}>
                <h3 className="font-semibold text-gray-800 mb-4">📋 Detalles de la Transacción</h3>
                <div className="space-y-3 text-sm">
                  
                  {(paymentData.x_ref_payco) && ( // Usar x_ref_payco que es el estándar del webhook/respuesta
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referencia de Pago:</span>
                      <span className="font-mono font-semibold">
                        {paymentData.x_ref_payco}
                      </span>
                    </div>
                  )}
                  
                  {(paymentData.x_id_invoice) && ( // Usar x_id_invoice que es el estándar
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de Orden:</span>
                      <span className="font-mono font-semibold">
                        {paymentData.x_id_invoice}
                      </span>
                    </div>
                  )}
                  
                  {(paymentData.x_amount) && ( // Usar x_amount
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-semibold">
                        ${parseFloat(paymentData.x_amount).toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  )}
                  
                  {(paymentData.x_bank_name) && ( // Usar x_bank_name
                    <div className="flex justify-between">
                      <span className="text-gray-600">Banco:</span>
                      <span>{paymentData.x_bank_name}</span>
                    </div>
                  )}
                  
                  {(paymentData.x_approval_code) && ( // Usar x_approval_code
                    <div className="flex justify-between">
                      <span className="text-gray-600">Código de Autorización:</span>
                      <span className="font-mono">
                        {paymentData.x_approval_code}
                      </span>
                    </div>
                  )}
                  
                </div>
              </div>
            )}

            {/* Información de seguimiento */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="text-blue-600 text-xl mr-3">ℹ️</div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">¿Qué sigue?</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {paymentStatus === 'success' && (
                      <>
                        <li>• Tu pago ha sido confirmado</li>
                        <li>• Recibirás un email con los detalles</li>
                        <li>• Procesaremos tu pedido inmediatamente</li>
                      </>
                    )}
                    {paymentStatus === 'pending' && (
                      <>
                        <li>• Tu pago está siendo verificado</li>
                        <li>• Te notificaremos cuando se confirme</li>
                        <li>• Esto puede tomar unos minutos</li>
                      </>
                    )}
                    {(paymentStatus === 'failed' || paymentStatus === 'error') && (
                      <>
                        <li>• Tu pago no pudo ser procesado</li>
                        <li>• Puedes intentar nuevamente</li>
                        <li>• Contacta a soporte si persiste el problema</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Contador de redirección */}
            <div className="text-center">
              <div className="inline-flex items-center text-gray-600 text-sm mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Redirigiendo en unos segundos...
              </div>
              
              <div className="space-x-4">
                <button
                  onClick={() => redirectToFinalPage(paymentStatus, paymentData)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continuar ahora
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Ir al inicio
                </button>
              </div>
            </div>

            {/* Debug info en desarrollo */}
            {process.env.NODE_ENV === 'development' && paymentData && (
              <details className="mt-8 text-xs">
                <summary className="cursor-pointer text-gray-500 font-semibold">
                  🔧 Debug - Datos de ePayco
                </summary>
                <pre className="mt-2 bg-gray-100 p-3 rounded overflow-auto text-xs">
                  {JSON.stringify(paymentData, null, 2)}
                </pre>
              </details>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentResponse;