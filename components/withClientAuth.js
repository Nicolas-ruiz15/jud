// components/withClientAuth.js - HOC para proteger rutas de cliente
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

const withClientAuth = (WrappedComponent) => {
  const ProtectedComponent = (props) => {
    const { user, loading, checkAuth } = useAuth();
    const [isInitialized, setIsInitialized] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const initAuth = async () => {
        if (!loading && !isInitialized) {
          await checkAuth();
          setIsInitialized(true);
        }
      };
      
      initAuth();
    }, [loading, isInitialized, checkAuth]);

    useEffect(() => {
      if (isInitialized && !loading && !user) {
        // Usuario no autenticado, redirigir al login con la URL actual como parámetro
        const currentPath = router.asPath;
        router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }, [user, loading, isInitialized, router]);

    // Mostrar loading mientras verifica autenticación
    if (loading || !isInitialized) {
      return (
        <Layout>
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Verificando acceso...</p>
          </div>
        </Layout>
      );
    }

    // Si no hay usuario después de la verificación, mostrar mensaje (mientras redirige)
    if (!user) {
      return (
        <Layout>
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Acceso Requerido
              </h3>
              <p className="text-gray-600 mb-4">
                Necesitas iniciar sesión para acceder a esta página
              </p>
              <p className="text-sm text-gray-500">
                Redirigiendo al login...
              </p>
            </div>
          </div>
        </Layout>
      );
    }

    // Usuario autenticado, renderizar el componente
    return <WrappedComponent {...props} user={user} />;
  };

  // Preservar el nombre del componente para debugging
  ProtectedComponent.displayName = `withClientAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ProtectedComponent;
};

export default withClientAuth;