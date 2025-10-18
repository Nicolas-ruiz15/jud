// components/EpaycoStandardPayment.js - Componente para ePayco Standard
import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

const EpaycoStandardPayment = ({ orderData, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);

  const handlePayment = async () => {
    if (!orderData) {
      toast.error('Datos de orden faltantes');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Creando pago con ePayco Standard...');

      // Crear el pago en el backend
      const response = await fetch('/api/epayco/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error creando el pago');
      }

      console.log('✅ Pago creado, redirigiendo a ePayco...');

      // Crear formulario dinámico para POST a ePayco
      createEpaycoForm(result.data.epayco_data, result.data.epayco_url);

    } catch (error) {
      console.error('💥 Error:', error);
      setIsLoading(false);
      toast.error(error.message || 'Error procesando el pago');
      onError?.(error.message);
    }
  };

  const createEpaycoForm = (epaycoData, epaycoUrl) => {
    console.log('📝 Creando formulario para ePayco...');

    // Crear formulario dinámico
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = epaycoUrl;
    form.style.display = 'none';

    // Agregar todos los campos de ePayco
    Object.keys(epaycoData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = epaycoData[key];
      form.appendChild(input);
    });

    // Agregar al DOM y enviar
    document.body.appendChild(form);
    
    console.log('🔄 Enviando formulario a ePayco...');
    form.submit();

    // El usuario será redirigido a ePayco
    // No necesitamos setIsLoading(false) porque la página cambiará
  };

  return (
    <div className="epayco-standard-payment">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">💳 Pago Seguro con ePayco</h3>
        <p className="text-sm text-gray-600 mb-4">
          Serás redirigido a la página segura de ePayco para completar tu pago
        </p>
        
        {/* Resumen del pedido */}
        {orderData && orderData.cart_summary && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-3">📋 Resumen del Pedido</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${(orderData.cart_summary.subtotal || 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>${(orderData.cart_summary.shipping || 15000).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (19%):</span>
                <span>${(orderData.cart_summary.tax || 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-blue-600">
                  ${orderData.cart_summary.total.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Información sobre el proceso */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-800 mb-2">🔄 Proceso de Pago</h4>
          <div className="text-blue-700 text-sm space-y-1">
            <p>1. Haz clic en "Pagar con ePayco"</p>
            <p>2. Serás redirigido a la página segura de ePayco</p>
            <p>3. Completa tu pago usando tu método preferido</p>
            <p>4. ePayco te traerá de vuelta con el resultado</p>
          </div>
        </div>

        {/* Métodos de pago disponibles */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">💳 Métodos de Pago Disponibles</h4>
          <div className="text-green-700 text-sm">
            <p>• Tarjetas de crédito y débito</p>
            <p>• PSE (Pagos Seguros en Línea)</p>
            <p>• Efectivo (Efecty, Gana, Baloto)</p>
            <p>• Daviplata y otros wallets</p>
          </div>
        </div>
      </div>

      {/* Botón de pago */}
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
            <span>Creando pago...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="mr-2">🚀</span>
            <span>Pagar con ePayco</span>
            <span className="ml-2">
              ${orderData?.cart_summary?.total?.toLocaleString('es-CO') || '0'} COP
            </span>
          </div>
        )}
      </button>

      {/* Información de seguridad */}
      <div className="mt-6 text-center">
        <div className="text-xs text-gray-500 space-y-1">
          <p>🔒 Tu pago está protegido por ePayco</p>
          <p>🏛️ Certificado de seguridad SSL</p>
          <p>✅ PCI DSS Compliance</p>
        </div>
      </div>

      {/* Debug info en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-gray-500">🔧 Debug Info</summary>
          <div className="mt-2 bg-gray-100 p-2 rounded">
            <div>Modo: {process.env.NODE_ENV === 'production' ? 'Producción' : 'Desarrollo'}</div>
            <div>Método: ePayco Standard Checkout</div>
            <div>Estado: {isLoading ? 'Procesando' : 'Listo'}</div>
          </div>
        </details>
      )}

      {/* Formulario oculto (referencia, no se usa directamente) */}
      <form ref={formRef} style={{ display: 'none' }} />
    </div>
  );
};

export default EpaycoStandardPayment;