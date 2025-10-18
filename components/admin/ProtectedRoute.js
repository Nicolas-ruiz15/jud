import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/me');
      if (response.ok) {
        setAuthenticated(true);
      } else {
        router.replace('/admin/login');
      }
    } catch (error) {
      router.replace('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return children;
};

export default ProtectedRoute;