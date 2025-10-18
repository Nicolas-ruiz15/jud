import { GAItem, GAEvent } from '../types/gtag';

// Verificar si gtag está disponible
const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Verificar si analytics está disponible
const isAnalyticsAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.analytics === 'object';
};

// Función genérica para trackear eventos
export const trackEvent = (eventName: string, parameters: Partial<GAEvent> = {}): void => {
  if (isGtagAvailable()) {
    window.gtag('event', eventName, parameters);
  }
  
  if (isAnalyticsAvailable() && window.analytics?.trackEvent) {
    window.analytics.trackEvent(eventName, parameters);
  }
};

// Trackear vista de producto
export const trackViewItem = (item: {
  id: string;
  name: string;
  category?: string;
  price: number;
}): void => {
  const gaItem: GAItem = {
    item_id: item.id.toString(),
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    quantity: 1
  };

  trackEvent('view_item', {
    currency: 'COP',
    value: item.price,
    items: [gaItem]
  });

  if (isAnalyticsAvailable() && window.analytics?.trackViewItem) {
    window.analytics.trackViewItem(item);
  }
};

// Trackear agregar al carrito
export const trackAddToCart = (item: {
  id: string;
  name: string;
  category?: string;
  price: number;
}, quantity: number = 1): void => {
  const gaItem: GAItem = {
    item_id: item.id.toString(),
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    quantity
  };

  trackEvent('add_to_cart', {
    currency: 'COP',
    value: item.price * quantity,
    items: [gaItem]
  });

  if (isAnalyticsAvailable() && window.analytics?.trackAddToCart) {
    window.analytics.trackAddToCart(item, quantity);
  }
};

// Trackear remover del carrito
export const trackRemoveFromCart = (item: {
  id: string;
  name: string;
  category?: string;
  price: number;
}, quantity: number = 1): void => {
  const gaItem: GAItem = {
    item_id: item.id.toString(),
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    quantity
  };

  trackEvent('remove_from_cart', {
    currency: 'COP',
    value: item.price * quantity,
    items: [gaItem]
  });

  if (isAnalyticsAvailable() && window.analytics?.trackRemoveFromCart) {
    window.analytics.trackRemoveFromCart(item, quantity);
  }
};

// Trackear inicio de checkout
export const trackBeginCheckout = (items: Array<{
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
}>, totalValue: number): void => {
  const gaItems: GAItem[] = items.map(item => ({
    item_id: item.id.toString(),
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    quantity: item.quantity
  }));

  trackEvent('begin_checkout', {
    currency: 'COP',
    value: totalValue,
    items: gaItems
  });

  if (isAnalyticsAvailable() && window.analytics?.trackBeginCheckout) {
    window.analytics.trackBeginCheckout(items, totalValue);
  }
};

// Trackear compra
export const trackPurchase = (
  transactionId: string,
  items: Array<{
    id: string;
    name: string;
    category?: string;
    price: number;
    quantity: number;
  }>,
  totalValue: number,
  shipping: number = 0,
  tax: number = 0
): void => {
  const gaItems: GAItem[] = items.map(item => ({
    item_id: item.id.toString(),
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    quantity: item.quantity
  }));

  trackEvent('purchase', {
    transaction_id: transactionId,
    currency: 'COP',
    value: totalValue,
    shipping,
    tax,
    items: gaItems
  });

  if (isAnalyticsAvailable() && window.analytics?.trackPurchase) {
    window.analytics.trackPurchase(transactionId, items, totalValue, shipping, tax);
  }
};

// Trackear búsqueda
export const trackSearch = (searchTerm: string, resultsCount?: number): void => {
  trackEvent('search', {
    search_term: searchTerm,
    ...(resultsCount !== undefined && { results_count: resultsCount })
  });

  if (isAnalyticsAvailable() && window.analytics?.trackSearch) {
    window.analytics.trackSearch(searchTerm, resultsCount);
  }
};

// Trackear vista de lista de productos
export const trackViewItemList = (items: Array<{
  id: string;
  name: string;
  category?: string;
  price: number;
}>, listName: string): void => {
  const gaItems: GAItem[] = items.map((item, index) => ({
    item_id: item.id.toString(),
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    index
  }));

  trackEvent('view_item_list', {
    item_list_name: listName,
    items: gaItems
  });

  if (isAnalyticsAvailable() && window.analytics?.trackViewItemList) {
    window.analytics.trackViewItemList(items, listName);
  }
};

// Trackear selección de item
export const trackSelectItem = (item: {
  id: string;
  name: string;
  category?: string;
  price: number;
}, listName: string): void => {
  const gaItem: GAItem = {
    item_id: item.id.toString(),
    item_name: item.name,
    item_category: item.category,
    price: item.price
  };

  trackEvent('select_item', {
    item_list_name: listName,
    items: [gaItem]
  });

  if (isAnalyticsAvailable() && window.analytics?.trackSelectItem) {
    window.analytics.trackSelectItem(item, listName);
  }
};

// Trackear login
export const trackLogin = (method: string): void => {
  trackEvent('login', { method });
};

// Trackear registro
export const trackSignUp = (method: string): void => {
  trackEvent('sign_up', { method });
};

// Trackear compartir
export const trackShare = (contentType: string, itemId: string, method: string): void => {
  trackEvent('share', {
    content_type: contentType,
    item_id: itemId,
    method
  });
};

// Trackear eventos personalizados
export const trackCustomEvent = (eventName: string, parameters: Record<string, any> = {}): void => {
  trackEvent(eventName, parameters);
};

// Configurar user ID
export const setUserId = (userId: string): void => {
  if (isGtagAvailable()) {
    window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '', {
      user_id: userId
    });
  }

  if (isAnalyticsAvailable() && window.analytics?.setUserId) {
    window.analytics.setUserId(userId);
  }
};

// Trackear página vista
export const trackPageView = (pagePath: string, pageTitle: string): void => {
  if (isGtagAvailable()) {
    window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '', {
      page_path: pagePath,
      page_title: pageTitle
    });
  }

  if (isAnalyticsAvailable() && window.analytics?.trackPageView) {
    window.analytics.trackPageView(pagePath, pageTitle);
  }
};

// Exportar todas las funciones como un objeto
export const analytics = {
  trackEvent,
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackViewItemList,
  trackSelectItem,
  trackLogin,
  trackSignUp,
  trackShare,
  trackCustomEvent,
  setUserId,
  trackPageView
};

export default analytics;