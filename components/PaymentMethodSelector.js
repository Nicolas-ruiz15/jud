// components/PaymentMethodSelector.js - Selector de métodos de pago
import { useState } from 'react';
import EpaycoPayment from './EpaycoPayment';

const PaymentMethodSelector = ({ orderData, onPaymentSuccess, onPaymentError }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const paymentMethods = [
    {
      id: 'epayco',
      name: 'Pago en línea con ePayco',
      description: 'Tarjeta de crédito, débito, PSE o efectivo',
      icon: '💳',
      enabled: true
    },
    {
      id: 'bank_transfer',
      name: 'Transferencia bancaria',
      description: 'Pago manual por transferencia',
      icon: '🏦',
      enabled: true
    },
    {
      id: 'cash_on_delivery',
      name: 'Pago contra entrega',
      description: 'Paga cuando recibas tu pedido',
      icon: '📦',
      enabled: false // Puedes habilitar según tu lógica de negocio
    }
  ];

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    
    if (methodId === 'epayco') {
      setShowPayment(true);
    } else {
      setShowPayment(false);
      // Para otros métodos, puedes manejar la lógica correspondiente
      handleOtherPaymentMethods(methodId);
    }
  };

  const handleOtherPaymentMethods = async (methodId) => {
    try {
      // Actualizar la orden con el método de pago seleccionado
      const response = await fetch(`/api/orders/${orderData.order_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          payment_method: methodId,
          payment_status: methodId === 'bank_transfer' ? 'pending' : 'pending'
        })
      });

      if (response.ok) {
        // Redirigir según el método
        if (methodId === 'bank_transfer') {
          window.location.href = `/payment/bank-transfer/${orderData.order_id}`;
        } else if (methodId === 'cash_on_delivery') {
          window.location.href = `/payment/success/${orderData.order_id}`;
        }
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      onPaymentError?.('Error al procesar el método de pago');
    }
  };

  return (
    <div className="payment-method-selector">
      <h3 className="text-xl font-semibold mb-6">Selecciona tu método de pago</h3>
      
      {!showPayment && (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                method.enabled 
                  ? selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
              }`}
              onClick={() => method.enabled && handleMethodSelect(method.id)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id={method.id}
                  name="payment_method"
                  value={method.id}
                  checked={selectedMethod === method.id}
                  onChange={() => method.enabled && handleMethodSelect(method.id)}
                  disabled={!method.enabled}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <label
                      htmlFor={method.id}
                      className={`font-medium ${method.enabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      {method.name}
                    </label>
                    {!method.enabled && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 ml-11">
                    {method.description}
                  </p>
                </div>
              </div>

              {/* Información adicional para cada método */}
              {selectedMethod === method.id && method.enabled && (
                <div className="mt-4 ml-11 p-3 bg-white rounded border">
                  {method.id === 'epayco' && (
                    <div>
                      <p className="text-sm text-green-600 font-medium mb-2">
                        ✓ Pago seguro y protegido
                      </p>
                      <p className="text-xs text-gray-500">
                        Acepta Visa, Mastercard, American Express, PSE y pagos en efectivo.
                        Tu información está protegida con cifrado SSL.
                      </p>
                    </div>
                  )}
                  
                  {method.id === 'bank_transfer' && (
                    <div>
                      <p className="text-sm text-blue-600 font-medium mb-2">
                        ℹ Instrucciones de pago
                      </p>
                      <p className="text-xs text-gray-500">
                        Te enviaremos los datos bancarios para realizar la transferencia.
                        Tu pedido se procesará una vez confirmemos el pago.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {selectedMethod && selectedMethod !== 'epayco' && (
            <div className="mt-6">
              <button
                onClick={() => handleOtherPaymentMethods(selectedMethod)}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Continuar con {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mostrar componente de ePayco cuando esté seleccionado */}
      {showPayment && selectedMethod === 'epayco' && (
        <div className="mt-6">
          <div className="mb-4">
            <button
              onClick={() => {
                setShowPayment(false);
                setSelectedMethod('');
              }}
              className="text-blue-600 hover:underline text-sm flex items-center"
            >
              ← Cambiar método de pago
            </button>
          </div>
          
          <EpaycoPayment
            orderData={orderData}
            onSuccess={(response) => {
              console.log('Payment successful:', response);
              onPaymentSuccess?.(response);
            }}
            onError={(error) => {
              console.error('Payment error:', error);
              onPaymentError?.(error);
              setShowPayment(false);
            }}
            onCancel={() => {
              console.log('Payment cancelled');
              setShowPayment(false);
            }}
          />
        </div>
      )}

      {/* Resumen del pedido */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-3">Resumen del pedido</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${orderData?.subtotal?.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between">
            <span>Envío:</span>
            <span>${orderData?.shipping_amount?.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (19%):</span>
            <span>${orderData?.tax_amount?.toLocaleString('es-CO')}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${orderData?.total_amount?.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;