// pages/verify-email/[token].js - Página para verificar email
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [status, setStatus] = useState('loading'); // loading, success, error, already_verified
  const [message, setMessage] = useState('Verificando tu email...');
  const [userEmail, setUserEmail] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  // Countdown para redirección automática
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      router.push('/login');
    }
  }, [status, countdown, router]);

  const verifyEmail = async (verificationToken) => {
    try {
      setStatus('loading');
      setMessage('Verificando tu email...');

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus(data.data.already_verified ? 'already_verified' : 'success');
        setUserEmail(data.data.user.email);
        
        if (data.data.already_verified) {
          setMessage('Tu email ya estaba verificado. Puedes iniciar sesión.');
        } else {
          setMessage('¡Email verificado exitosamente! Te hemos enviado un email de bienvenida.');
        }
      } else {
        setStatus('error');
        if (data.code === 'INVALID_TOKEN') {
          setMessage('El enlace de verificación ha expirado o no es válido.');
        } else {
          setMessage(data.message || 'Error al verificar el email.');
        }
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      setStatus('error');
      setMessage('Error de conexión. Inténtalo de nuevo.');
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) return;
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Nuevo enlace enviado a tu email.');
      } else {
        setMessage(data.message || 'Error enviando el enlace.');
      }
    } catch (error) {
      setMessage('Error enviando el enlace. Inténtalo de nuevo.');
    }
  };

  return (
    <>
      <Head>
        <title>Verificar Email - Judaica Breslov Colombia</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <img
              className="mx-auto h-12 w-auto"
              src="/logo.png"
              alt="Judaica Breslov Colombia"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verificación de Email
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            
            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Verificando...
                </h3>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¡Email Verificado!
                </h3>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
                <p className="text-xs text-gray-500 mb-4">
                  Redirigiendo al login en {countdown} segundo{countdown !== 1 ? 's' : ''}...
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ir al Login
                </button>
              </div>
            )}

            {/* Already Verified State */}
            {status === 'already_verified' && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Email Ya Verificado
                </h3>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
                <p className="text-xs text-gray-500 mb-4">
                  Redirigiendo al login en {countdown} segundo{countdown !== 1 ? 's' : ''}...
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ir al Login
                </button>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error de Verificación
                </h3>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
                
                <div className="space-y-3">
                  {userEmail && (
                    <button
                      onClick={handleResendVerification}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Solicitar Nuevo Enlace
                    </button>
                  )}
                  
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Volver a Registrarse
                  </button>
                  
                  <button
                    onClick={() => router.push('/')}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ir al Inicio
                  </button>
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                ¿Necesitas ayuda?{' '}
                <a 
                  href="https://wa.me/573009291156" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Contáctanos por WhatsApp
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}