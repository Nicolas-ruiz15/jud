// context/AuthContext.js - TU CÓDIGO MEJORADO
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
		if (response.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
  // Redirigir automáticamente a verificación
  router.push(`/verification-pending?email=${encodeURIComponent(data.email)}`);
  
  return { 
    success: false, 
    redirected: true,
    code: 'EMAIL_NOT_VERIFIED',
    message: 'Redirigiendo a verificación de email'
  };
}
		else {
        return { 
          success: false, 
          message: data.message,
          errors: data.errors // Para manejar errores específicos de campos
        };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const register = async (userData) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // ⚠️ IMPORTANTE: Solo setear user si NO necesita verificación
      if (data.next_step !== 'verify_email') {
        setUser(data.user);
      }
      
      // ✅ RETORNAR TODA LA RESPUESTA DE LA API
      return { 
        success: true, 
        user: data.user,
        next_step: data.next_step, // <-- ESTO FALTABA
        verification_email_sent: data.verification_email_sent,
        message: data.message
      };
    } else {
      return { 
        success: false, 
        message: data.message,
        errors: data.errors
      };
    }
  } catch (error) {
    console.error('Error en register:', error);
    return { success: false, message: 'Error de conexión' };
  }
};
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      router.push('/');
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      setUser(null); // Limpiar usuario aunque falle la API
      router.push('/');
      return { success: false, message: 'Error en logout' };
    }
  };

  // Función para actualizar datos del usuario
  const updateUser = (updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
  };

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Función para verificar si está en una página protegida
  const requireAuth = (redirectTo = '/login') => {
    if (!loading && !user) {
      const currentPath = router.asPath;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
      return false;
    }
    return !!user;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    updateUser,
    hasRole,
    requireAuth,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};