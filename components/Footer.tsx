import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const footerLinks = {
    company: [
      { name: 'Sobre Nosotros', href: '/sobre-nosotros' },
      { name: 'Contacto', href: '/contacto' },
      { name: 'Blog', href: '/blog' },
      { name: 'Preguntas Frecuentes', href: '/faq' },
    ],
    products: [
      { name: 'Libros Breslov', href: '/categorias/breslov' },
      { name: 'Mezuzot', href: '/categorias/mezuza' },
      { name: 'Tefilín', href: '/categorias/tefilin' },
      { name: 'Talitot', href: '/categorias/talit-amp-tzittzit' },
    ],
    support: [
      { name: 'Centro de Ayuda', href: '/centro-ayuda' },
      { name: 'Métodos de Pago', href: '/metodos-pago' },
      { name: 'Envíos', href: '/envios' },
      { name: 'Devoluciones', href: '/devoluciones' },
    ],
    legal: [
      { name: 'Términos y Condiciones', href: '/terminos-condiciones' },
      { name: 'Política de Privacidad', href: '/politica-privacidad' },
      { name: 'Política de Cookies', href: '/politica-cookies' },
    ],
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      if (!email || !email.includes('@')) {
        setMessage({ type: 'error', text: 'Por favor ingresa un email válido' });
        return;
      }

      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          name: name.trim() || 'Suscriptor'
        }),
      });

      const data = await response.json();

      if (data.success) {
  setMessage({ 
    type: 'success', 
    text: data.message || '¡Gracias! Te has suscrito exitosamente. Revisa tu email.'
  });
} else if (data.alreadySubscribed) {
  setMessage({ 
    type: 'warning', 
    text: data.message || 'Ya estás suscrito a nuestro newsletter.'
  });
	
		setEmail('');
        setName('');
        
        // Tracking para analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'newsletter_signup', {
            event_category: 'engagement',
            event_label: 'footer'
          });
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Error al suscribirse. Inténtalo de nuevo.' 
        });
      }
    } catch (error) {
      console.error('Error suscripción newsletter:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error de conexión. Inténtalo de nuevo.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Mantente Informado</h3>
            <p className="text-gray-300 mb-6">
              Suscríbete a nuestro newsletter y recibe ofertas especiales, nuevos productos y contenido exclusivo.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Tu nombre (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Tu email *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Suscribiendo...
                  </span>
                ) : (
                  'Suscribirse'
                )}
              </button>
            </form>

            {/* Mensaje de estado */}
            {message.text && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === 'success' 
  ? 'bg-green-600 text-white' 
  : message.type === 'warning'
  ? 'bg-yellow-600 text-white'
  : 'bg-red-600 text-white'              }`}>
                {message.text}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3">
              * Campo requerido. No spam, puedes cancelar en cualquier momento.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <Image 
                src="/images/logo-llama.png"
                alt="Logo Judaica Breslov"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <h1 className="font-bold text-xl">Judaica Breslov</h1>
                <p className="text-sm text-gray-400">Colombia</p>
              </div>
            </Link>
            <p className="text-gray-300 mb-6 max-w-md">
              Tu tienda online de confianza para productos judaicos en Colombia. 
              Ofrecemos libros, artículos religiosos y todo lo que necesitas para tu hogar judío.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>contacto@judaicabreslovcolombia.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Bogotá, Colombia</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span>+57 300 929 1156</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-4 mt-6">
              <a href="https://facebook.com/judaicabreslovcolombia" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://instagram.com/judaicabreslovcolombia" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348 0-1.297 1.051-2.348 2.348-2.348 1.297 0 2.348 1.051 2.348 2.348 0 1.297-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348 0-1.297 1.051-2.348 2.348-2.348 1.297 0 2.348 1.051 2.348 2.348 0 1.297-1.051 2.348-2.348 2.348z"/>
                </svg>
              </a>
              <a href="https://wa.me/573009291156?text=Hola%20Judaica%20Breslov%20Colombia%2C%20estoy%20interesado%20en%20los%20productos%20que%20venden" className="text-gray-400 hover:text-white transition-colors" aria-label="WhatsApp">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-300 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Productos</h4>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-300 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Soporte</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-300 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap gap-6 mb-4 md:mb-0">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <p className="text-gray-400 text-sm">
              © {currentYear} Judaica Breslov Colombia. Todos los derechos reservados.
            </p>
          </div>
        </div>

        {/* Payment Methods & Security */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h5 className="text-sm font-semibold mb-3">Métodos de Pago</h5>
              <div className="flex space-x-4">
                <div className="bg-white rounded p-2">
                  <span className="text-blue-600 font-bold text-xs">VISA</span>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="text-orange-600 font-bold text-xs">MC</span>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="text-blue-800 font-bold text-xs">PSE</span>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="text-red-600 font-bold text-xs">EFECTY</span>
                </div>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <h5 className="text-sm font-semibold mb-3">Seguridad</h5>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">Sitio Seguro SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;