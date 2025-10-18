// context/AdminAuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth debe ser usado dentro de AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!initialized) {
      checkAuth();
      setInitialized(true);
    }
  }, [initialized]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        // Solo redirigir si estamos en una ruta protegida
        if (router.pathname.startsWith('/admin') && router.pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
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
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        toast.success('Bienvenido al panel de administración');
        router.replace('/admin');
        return { success: true };
      } else {
        toast.error(data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error en login:', error);
      toast.error('Error de conexión');
      return { success: false, message: 'Error de conexión' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      toast.success('Sesión cerrada exitosamente');
      router.replace('/admin/login');
    } catch (error) {
      console.error('Error en logout:', error);
      toast.error('Error cerrando sesión');
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};