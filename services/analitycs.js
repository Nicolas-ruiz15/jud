const axios = require('axios');

class AnalyticsService {
  constructor() {
    this.gtmId = process.env.GTM_ID;
    this.gaId = process.env.GOOGLE_ANALYTICS_ID;
  }

  // Script para Google Tag Manager (Head)
  getGTMHeadScript() {
    if (!this.gtmId) return '';
    
    return `
      <!-- Google Tag Manager -->
      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${this.gtmId}');</script>
      <!-- End Google Tag Manager -->
    `;
  }

  // Script para Google Tag Manager (Body)
  getGTMBodyScript() {
    if (!this.gtmId) return '';
    
    return `
      <!-- Google Tag Manager (noscript) -->
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${this.gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
      <!-- End Google Tag Manager (noscript) -->
    `;
  }

  // Script para Google Analytics 4
  getGA4Script() {
    if (!this.gaId) return '';
    
    return `
      <!-- Google tag (gtag.js) -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=${this.gaId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${this.gaId}');
      </script>
    `;
  }

  // Configuración del dataLayer para eventos de ecommerce
  getDataLayerScript() {
    return `
      <script>
        window.dataLayer = window.dataLayer || [];
        
        // Función para trackear eventos
        function trackEvent(eventName, parameters) {
          window.dataLayer.push({
            event: eventName,
            ...parameters
          });
        }

        // Función para trackear view_item
        function trackViewItem(item) {
          trackEvent('view_item', {
            currency: 'COP',
            value: item.price,
            items: [{
              item_id: item.id,
              item_name: item.name,
              item_category: item.category,
              price: item.price,
              quantity: 1
            }]
          });
        }

        // Función para trackear add_to_cart
        function trackAddToCart(item, quantity = 1) {
          trackEvent('add_to_cart', {
            currency: 'COP',
            value: item.price * quantity,
            items: [{
              item_id: item.id,
              item_name: item.name,
              item_category: item.category,
              price: item.price,
              quantity: quantity
            }]
          });
        }

        // Función para trackear remove_from_cart
        function trackRemoveFromCart(item, quantity = 1) {
          trackEvent('remove_from_cart', {
            currency: 'COP',
            value: item.price * quantity,
            items: [{
              item_id: item.id,
              item_name: item.name,
              item_category: item.category,
              price: item.price,
              quantity: quantity
            }]
          });
        }

        // Función para trackear begin_checkout
        function trackBeginCheckout(items, value) {
          trackEvent('begin_checkout', {
            currency: 'COP',
            value: value,
            items: items.map(item => ({
              item_id: item.id,
              item_name: item.name,
              item_category: item.category,
              price: item.price,
              quantity: item.quantity
            }))
          });
        }

        // Función para trackear purchase
        function trackPurchase(transactionId, items, value, shipping = 0, tax = 0) {
          trackEvent('purchase', {
            transaction_id: transactionId,
            currency: 'COP',
            value: value,
            shipping: shipping,
            tax: tax,
            items: items.map(item => ({
              item_id: item.id,
              item_name: item.name,
              item_category: item.category,
              price: item.price,
              quantity: item.quantity
            }))
          });
        }

        // Función para trackear search
        function trackSearch(searchTerm, results = null) {
          trackEvent('search', {
            search_term: searchTerm,
            ...(results !== null && { results_count: results })
          });
        }

        // Función para trackear view_item_list
        function trackViewItemList(items, listName) {
          trackEvent('view_item_list', {
            item_list_name: listName,
            items: items.map((item, index) => ({
              item_id: item.id,
              item_name: item.name,
              item_category: item.category,
              price: item.price,
              index: index
            }))
          });
        }

        // Función para trackear select_item
        function trackSelectItem(item, listName) {
          trackEvent('select_item', {
            item_list_name: listName,
            items: [{
              item_id: item.id,
              item_name: item.name,
              item_category: item.category,
              price: item.price
            }]
          });
        }

        // Función para trackear eventos personalizados
        function trackCustomEvent(eventName, parameters) {
          trackEvent(eventName, parameters);
        }

        // Función para configurar el user ID
        function setUserId(userId) {
          if (typeof gtag !== 'undefined') {
            gtag('config', '${this.gaId}', {
              user_id: userId
            });
          }
        }

        // Función para trackear página vista
        function trackPageView(pagePath, pageTitle) {
          if (typeof gtag !== 'undefined') {
            gtag('config', '${this.gaId}', {
              page_path: pagePath,
              page_title: pageTitle
            });
          }
        }

        // Exponemos las funciones globalmente
        window.analytics = {
          trackEvent,
          trackViewItem,
          trackAddToCart,
          trackRemoveFromCart,
          trackBeginCheckout,
          trackPurchase,
          trackSearch,
          trackViewItemList,
          trackSelectItem,
          trackCustomEvent,
          setUserId,
          trackPageView
        };
      </script>
    `;
  }

  // Función para trackear conversiones del lado del servidor
  async trackServerSideEvent(eventName, parameters, clientId = null) {
    if (!this.gaId) return;

    try {
      const measurementId = this.gaId;
      const apiSecret = process.env.GA4_API_SECRET;
      
      if (!apiSecret) {
        console.warn('GA4_API_SECRET no configurado para eventos server-side');
        return;
      }

      const payload = {
        client_id: clientId || this.generateClientId(),
        events: [{
          name: eventName,
          params: parameters
        }]
      };

      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        console.error('Error enviando evento a GA4:', response.statusText);
      }
    } catch (error) {
      console.error('Error en trackServerSideEvent:', error);
    }
  }

  // Generar client ID único
  generateClientId() {
    return Date.now() + '.' + Math.random().toString(36).substr(2, 9);
  }

  // Configuración para Enhanced Ecommerce
  getEnhancedEcommerceConfig() {
    return `
      <script>
        // Configuración avanzada para ecommerce
        window.ecommerceConfig = {
          currency: 'COP',
          country: 'CO',
          language: 'es',
          
          // Función para trackear promociones
          trackPromotion: function(promotionId, promotionName, creative, position) {
            trackEvent('view_promotion', {
              promotion_id: promotionId,
              promotion_name: promotionName,
              creative_name: creative,
              creative_slot: position
            });
          },

          // Función para trackear clics en promociones
          trackPromotionClick: function(promotionId, promotionName) {
            trackEvent('select_promotion', {
              promotion_id: promotionId,
              promotion_name: promotionName
            });
          },

          // Función para trackear refunds
          trackRefund: function(transactionId, items = null) {
            const eventData = {
              transaction_id: transactionId,
              currency: 'COP'
            };
            
            if (items) {
              eventData.items = items.map(item => ({
                item_id: item.id,
                item_name: item.name,
                quantity: item.quantity,
                price: item.price
              }));
            }
            
            trackEvent('refund', eventData);
          },

          // Función para trackear wish list
          trackAddToWishlist: function(item) {
            trackEvent('add_to_wishlist', {
              currency: 'COP',
              value: item.price,
              items: [{
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                price: item.price,
                quantity: 1
              }]
            });
          },

          // Función para trackear share
          trackShare: function(contentType, itemId, method) {
            trackEvent('share', {
              content_type: contentType,
              item_id: itemId,
              method: method
            });
          }
        };

        // Exponemos la configuración globalmente
        window.analytics = Object.assign(window.analytics || {}, window.ecommerceConfig);
      </script>
    `;
  }

  // Función para crear el pixel de conversión de Facebook (opcional)
  getFacebookPixelScript(pixelId) {
    if (!pixelId) return '';
    
    return `
      <!-- Facebook Pixel Code -->
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      </script>
      <noscript><img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
      /></noscript>
      <!-- End Facebook Pixel Code -->
    `;
  }
}

module.exports = AnalyticsService;