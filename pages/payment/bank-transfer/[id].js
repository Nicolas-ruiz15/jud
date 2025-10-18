// pages/payment/bank-transfer/[id].js - Página de instrucciones para transferencia bancaria
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Link from 'next/link';

const BankTransferPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState({});

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderData(data.data);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [field]: false }));
      }, 2000);
    });
  };

  const bankAccounts = [
    {
      bank: 'Bancolombia',
      accountType: 'Cuenta Ahorros',
      accountNumber: '372 000 264 71',
      accountHolder: 'Mariann Julieth Riaño Castillo'
    },
    {
      bank: 'Bancco Davivienda',
      accountType: 'Cuenta de Ahorros',
      accountNumber: '4884 1480 1859',
      accountHolder: 'Nicolas Mateo Ruiz Gomez'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Orden no encontrada
          </h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏦</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Instrucciones de Pago
            </h1>
            <p className="text-gray-600">
              Orden #{orderData.order_number}
            </p>
          </div>

          {/* Alerta importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <div className="text-yellow-600 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">
                  Importante
                </h3>
                <p className="text-yellow-700 text-sm">
                  Tu pedido se procesará una vez confirmemos el pago. 
                  Recuerda incluir el número de orden como referencia en tu transferencia.
                </p>
              </div>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Resumen del Pedido</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Número de Orden</p>
                <p className="font-mono font-semibold">{orderData.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total a Pagar</p>
                <p className="font-bold text-2xl text-blue-600">
                  ${orderData.total_amount?.toLocaleString('es-CO')} COP
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Cliente</p>
                <p>{orderData.customer_name}</p>
                <p className="text-sm text-gray-500">{orderData.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Estado</p>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                  Pendiente de Pago
                </span>
              </div>
            </div>
          </div>

          {/* Cuentas bancarias */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6">Cuentas Bancarias</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bankAccounts.map((account, index) => (
                <div key={index} className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 text-blue-600">
                    {account.bank}
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Tipo de Cuenta
                      </label>
                      <p className="text-gray-800">{account.accountType}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Número de Cuenta
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg">{account.accountNumber}</p>
                        <button
                          onClick={() => copyToClipboard(account.accountNumber, `account-${index}`)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Copiar número de cuenta"
                        >
                          {copied[`account-${index}`] ? '✓' : '📋'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Titular
                      </label>
                      <p className="text-gray-800">{account.accountHolder}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold mb-4">Instrucciones para el Pago</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Realiza la transferencia por el valor exacto de <strong>${orderData.total_amount?.toLocaleString('es-CO')} COP</strong></li>
              <li>En el concepto o referencia de la transferencia, incluye: <strong>{orderData.order_number}</strong></li>
              <li>Envía el comprobante de pago a <strong>contacto@judaicabreslovcolombia.com</strong></li>
              <li>Incluye en el email tu número de orden y nombre completo</li>
              <li>Una vez confirmemos el pago, procesaremos tu pedido</li>
            </ol>
          </div>

          {/* Datos para copiar fácilmente */}
          <div className="bg-green-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold mb-4 text-green-800">Datos para Copiar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Valor a Transferir
                </label>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-3 py-2 rounded border font-mono">
                    {orderData.total_amount}
                  </code>
                  <button
                    onClick={() => copyToClipboard(orderData.total_amount.toString(), 'amount')}
                    className="text-green-600 hover:text-green-800 p-1"
                  >
                    {copied.amount ? '✓' : '📋'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Referencia
                </label>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-3 py-2 rounded border font-mono">
                    {orderData.order_number}
                  </code>
                  <button
                    onClick={() => copyToClipboard(orderData.order_number, 'reference')}
                    className="text-green-600 hover:text-green-800 p-1"
                  >
                    {copied.reference ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={`mailto:contacto@judaicabreslovcolombia.com?subject=Comprobante de Pago - Orden ${orderData.order_number}&body=Adjunto el comprobante de pago para la orden ${orderData.order_number} por valor de $${orderData.total_amount?.toLocaleString('es-CO')} COP.%0A%0ANombre: ${orderData.customer_name}%0AEmail: ${orderData.customer_email}`}
              className="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enviar Comprobante por Email
            </a>
            
            <Link
              href={`/orders/${orderData.id}`}
              className="flex-1 bg-gray-200 text-gray-800 text-center py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Ver Estado del Pedido
            </Link>
          </div>

          {/* Información de contacto */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>¿Tienes dudas? Contáctanos:</p>
            <p>Email: contacto@judaicabreslov.com | WhatsApp: +57 300 929 1156</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankTransferPage;