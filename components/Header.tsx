// components/Header.tsx - HEADER MEJORADO CON DISEÑO MODERNO
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBlogMenuOpen, setIsBlogMenuOpen] = useState(false);
  const [isMobileBlogOpen, setIsMobileBlogOpen] = useState(false);
  const [israelTime, setIsraelTime] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  
  const { getCartItemsCount, loading: cartLoading } = useCart();

  // Función para obtener la hora de Israel
  const getIsraelTime = () => {
    const now = new Date();
    const israelTime = new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);
    return israelTime;
  };

  useEffect(() => {
    setIsraelTime(getIsraelTime());
    const interval = setInterval(() => {
      setIsraelTime(getIsraelTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Efecto de scroll para header dinámico
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.blog-menu-container')) {
        setIsBlogMenuOpen(false);
      }
      if (!target.closest('.mobile-menu-container')) {
        setIsMenuOpen(false);
        setIsMobileBlogOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar el hover del menú blog con delay
  const handleBlogMenuEnter = () => {
    setIsBlogMenuOpen(true);
  };

  const handleBlogMenuLeave = () => {
    setTimeout(() => {
      setIsBlogMenuOpen(false);
    }, 200);
  };

  const navigation = [
    { name: 'Inicio', href: '/', icon: '🏠' },
    { name: 'Productos', href: '/productos', icon: '📦' },
    { name: 'Categorías', href: '/categorias', icon: '📂' },
    { 
      name: 'Blog', 
      href: '/blog',
      icon: '📚',
      hasSubmenu: true,
      submenu: [
        { name: 'Todos los artículos', href: '/blog', icon: '📄', description: 'Ver todos nuestros artículos' },
        { name: 'Fiestas Judías', href: '/blog?categoria=fiestas-judias', icon: '🕯️', description: 'Tradiciones y celebraciones' },
        { name: 'Educación Judaica', href: '/blog?categoria=educacion-judaica', icon: '📖', description: 'Aprende sobre judaísmo' },
        { name: 'Guías de Productos', href: '/blog?categoria=guias-productos', icon: '🛍️', description: 'Cómo elegir productos kosher' },
        { name: 'Breslov', href: '/blog?categoria=breslov', icon: '✨', description: 'Enseñanzas del Rabí Najman' },
        { name: 'Judaísmo en Colombia', href: '/blog?categoria=judaismo-colombia', icon: '🇨🇴', description: 'Comunidad judía colombiana' }
      ]
    },
    { name: 'Contacto', href: '/contacto', icon: '📞' },
  ];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const cartItemsCount = getCartItemsCount();

  return (
    <header className={`bg-white shadow-lg sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-md bg-white/95' : ''}`}>
      {/* Top banner con hora de Israel - Mejorado */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white text-center py-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10"></div>
        <div className="container mx-auto px-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-lg animate-bounce">🚚</span>
            <span className="font-medium">Envío GRATIS a toda Colombia en compras mayores a $250.000</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
              <Image
                src="/israel-flag.png"
                alt="Israel"
                width={20}
                height={15}
                className="rounded-sm"
              />
              <span className="text-sm font-mono">{israelTime}</span>
            </div>
            <a 
              href="https://wa.me/573009291156?text=Hola%20Judaica%20Breslov%20Colombia%2C%20estoy%20interesado%20en%20los%20productos%20que%20venden" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span className="text-sm font-medium">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main header - Mejorado */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo mejorado */}
          <Link href="/" className="flex items-center group">
            <div className="relative transform transition-all duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Image
                src="/logo-judaica-breslov.png"
                alt="Judaica Breslov Colombia"
                width={280}
                height={200}
                className="object-contain relative z-10"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation - Mejorado */}
          <nav className="hidden lg:flex space-x-2">
            {navigation.map((item) => (
              <div key={item.name} className="relative blog-menu-container">
                {item.hasSubmenu ? (
                  <>
                    <button
                      className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 group hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 ${
                        router.pathname.startsWith('/blog') 
                          ? 'text-orange-600 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-sm' 
                          : 'text-gray-700 hover:text-orange-600'
                      }`}
                      onMouseEnter={handleBlogMenuEnter}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.name}</span>
                      <svg className={`w-4 h-4 transition-transform duration-300 ${isBlogMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Submenu mejorado con área de transición */}
                    <div 
                      className={`absolute top-full left-0 pt-2 transition-all duration-300 ${
                        isBlogMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                      }`}
                      onMouseEnter={handleBlogMenuEnter}
                      onMouseLeave={handleBlogMenuLeave}
                    >
                      <div className="w-80 bg-white shadow-2xl rounded-2xl border border-gray-100 py-4 transform transition-all duration-300">
                        <div className="px-4 pb-2 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">📚 Blog Judaica Breslov</h3>
                          <p className="text-xs text-gray-500">Artículos sobre tradiciones y enseñanzas judías</p>
                        </div>
                        {item.submenu?.map((subItem, index) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-200 ${
                              index === 0 ? 'mt-2' : ''
                            }`}
                            onClick={() => setIsBlogMenuOpen(false)}
                          >
                            <span className="text-lg mt-0.5">{subItem.icon}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900 hover:text-orange-600">
                                {subItem.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {subItem.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      router.pathname === item.href
                        ? 'text-orange-600 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-sm'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right side actions - Mejorado */}
          <div className="flex items-center space-x-2">
            {/* Search mejorado */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-3 text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-xl transition-all duration-300 transform hover:scale-105"
              aria-label="Buscar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Carrito mejorado */}
            <Link
              href="/carrito"
              className="p-3 text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-xl transition-all duration-300 relative group transform hover:scale-105"
              aria-label={`Carrito de compras${cartItemsCount > 0 ? ` (${cartItemsCount} productos)` : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v0m0 0v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m8 0h4" />
              </svg>
              
              {cartItemsCount > 0 && !cartLoading && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
              
              {cartLoading && (
                <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                </span>
              )}
            </Link>

            {/* Account mejorado */}
            <Link
              href="/mi-cuenta"
              className="p-3 text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-xl transition-all duration-300 transform hover:scale-105"
              aria-label="Mi cuenta"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {/* Mobile menu button mejorado */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-3 text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-xl transition-all duration-300 transform hover:scale-105"
              aria-label="Menú"
            >
              <svg 
                className={`w-5 h-5 transform transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Search bar mejorada */}
        {isSearchOpen && (
          <div className="py-6 border-t border-gray-100 bg-gradient-to-r from-orange-50/50 to-yellow-50/50">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="search"
                  placeholder="Buscar productos judaicos, artículos del blog, mezuzot, tefilín..."
                  className="w-full px-12 py-4 border-2 border-orange-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 shadow-lg text-gray-700 placeholder-gray-500 transition-all duration-300"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Buscar
                </button>
              </div>
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-4 text-xs text-gray-600 bg-white rounded-full px-4 py-2 shadow-sm">
                  <span className="flex items-center gap-1">
                    <span>🔍</span>
                    <span>Productos</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📚</span>
                    <span>Blog</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📄</span>
                    <span>Artículos</span>
                  </span>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Mobile menu mejorado */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 bg-gradient-to-b from-white to-gray-50 mobile-menu-container">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.hasSubmenu ? (
                    <>
                      <button
                        onClick={() => setIsMobileBlogOpen(!isMobileBlogOpen)}
                        className={`w-full flex items-center gap-3 text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 font-medium transition-all duration-300 py-4 px-4 rounded-xl ${
                          router.pathname.startsWith('/blog') 
                            ? 'text-orange-600 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-sm' 
                            : ''
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="flex-1 text-left">{item.name}</span>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isMobileBlogOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Submenu móvil mejorado */}
                      <div className={`overflow-hidden transition-all duration-300 ${isMobileBlogOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="ml-6 mt-2 space-y-1 border-l-2 border-orange-200 pl-4">
                          {item.submenu?.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="flex items-center gap-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 py-3 px-3 rounded-lg transition-all duration-200"
                              onClick={() => {
                                setIsMenuOpen(false);
                                setIsMobileBlogOpen(false);
                              }}
                            >
                              <span>{subItem.icon}</span>
                              <div>
                                <div className="text-sm font-medium">{subItem.name}</div>
                                <div className="text-xs text-gray-500">{subItem.description}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 font-medium transition-all duration-300 py-4 px-4 rounded-xl ${
                        router.pathname === item.href 
                          ? 'text-orange-600 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-sm' 
                          : ''
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Información adicional en móvil mejorada */}
              <div className="pt-6 mt-6 border-t border-gray-200 space-y-3">
                <Link
                  href="/carrito"
                  className="flex items-center justify-between px-4 py-4 text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-xl transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🛒</span>
                    <span className="font-medium">Carrito de compras</span>
                  </div>
                  {cartItemsCount > 0 ? (
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full px-3 py-1 font-bold shadow-lg">
                      {cartItemsCount > 99 ? '99+' : cartItemsCount}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-3 py-1">
                      Vacío
                    </span>
                  )}
                </Link>
                
                <a 
                  href="https://wa.me/573009291156?text=Hola,%20me%20interesa%20conocer%20más%20sobre%20sus%20productos" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-4 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <span className="text-lg">💬</span>
                  <span className="font-medium">Contáctanos por WhatsApp</span>
                </a>
                
                <div className="flex items-center gap-3 px-4 py-3 text-gray-600 bg-blue-50 rounded-xl">
                  <span className="text-lg">🇮🇱</span>
                  <span className="text-sm">Hora en Israel: <span className="font-mono font-bold">{israelTime}</span></span>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;