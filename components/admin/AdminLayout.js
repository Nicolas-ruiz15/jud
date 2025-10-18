// components/admin/AdminLayout.js - ACTUALIZADO CON VISITANTES
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminLayout = ({ children, title = 'Panel de Administración' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { user, logout } = useAdminAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: '📊',
      active: router.pathname === '/admin'
    },
    {
      title: 'Visitantes en Vivo', // NUEVO
      href: '/admin/live-visitors',
      icon: '👁️',
      active: router.pathname.startsWith('/admin/live-visitors'),
      submenu: [
        { title: 'Tiempo Real', href: '/admin/live-visitors' },
        { title: 'Analytics', href: '/admin/live-visitors/analytics' }
      ]
    },
    {
      title: 'Tickets', 
      href: '/admin/tickets',
      icon: '🎫',
      active: router.pathname.startsWith('/admin/tickets'),
      submenu: [
        { title: 'Todos los tickets', href: '/admin/tickets' },
        { title: 'Urgentes', href: '/admin/tickets?priority=high' },
        { title: 'Estadísticas', href: '/admin/tickets/stats' }
      ]
    },
    {
      title: 'Analytics', 
      href: '/admin/analytics',
      icon: '📈',
      active: router.pathname.startsWith('/admin/analytics'),
      submenu: [
        { title: 'Resumen', href: '/admin/analytics' },
        { title: 'Conversiones', href: '/admin/analytics/conversions' }
      ]
    },
    {
      title: 'Productos',
      href: '/admin/productos',
      icon: '📦',
      active: router.pathname.startsWith('/admin/productos'),
      submenu: [
        { title: 'Todos los productos', href: '/admin/productos' },
        { title: 'Agregar producto', href: '/admin/productos/nuevo' },
        { title: 'Categorías', href: '/admin/productos/categorias' }
      ]
    },
    {
      title: 'Órdenes',
      href: '/admin/ordenes',
      icon: '🛒',
      active: router.pathname.startsWith('/admin/ordenes')
    },
    {
      title: 'Usuarios',
      href: '/admin/users',
      icon: '👥',
      active: router.pathname.startsWith('/admin/usuarios')
    },
    {
      title: 'Configuración',
      href: '/admin/settings',
      icon: '⚙️',
      active: router.pathname.startsWith('/admin/configuracion')
    },
    {
      title: 'Reportes',
      href: '/admin/reports',
      icon: '📋',
      active: router.pathname.startsWith('/admin/reportes')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-primary-600 text-white">
          <h1 className="text-xl font-bold">Admin Judaica</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-2">
          {menuItems.map((item, index) => (
            <div key={index} className="mb-1">
              <Link href={item.href}>
                <div className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                  item.active 
                    ? 'bg-primary-100 text-primary-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.title}
                  {/* Indicador de tiempo real para visitantes */}
                  {item.title === 'Visitantes en Vivo' && (
                    <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                </div>
              </Link>
              
              {/* Submenu */}
              {item.submenu && item.active && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu.map((subitem, subindex) => (
                    <Link key={subindex} href={subitem.href}>
                      <div className="group flex items-center px-2 py-1 text-sm text-gray-500 rounded-md hover:text-gray-700 hover:bg-gray-50 cursor-pointer">
                        {subitem.title}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Menu */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</p>
              <button 
                onClick={logout}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                >
                  <span className="sr-only">Abrir sidebar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="ml-4 text-2xl font-semibold text-gray-900">{title}</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Ver notificaciones</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9a9 9 0 10-18 0v3l-5 5h5m0 0v1a3 3 0 006 0v-1m-6 0H9" />
                  </svg>
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                </button>
                
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                  Ver sitio web
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;