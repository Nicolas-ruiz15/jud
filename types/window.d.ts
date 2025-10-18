// types/window.d.ts - TIPOS COMPLETOS PARA WINDOW
export {};

declare global {
  interface Window {
    // 💬 Funciones de chat
    openLiveChat: () => void;
    sendChatMessage: (message: string) => void;
    startChatWithMessage: (message: string, context?: string) => void;
    
    // 📊 Analytics personalizado
    customAnalytics: {
      track: (eventName: string, props?: {
        category?: string;
        action?: string;
        label?: string;
        value?: number;
        metadata?: any;
      }) => void;
      trackConversion: (type: string, value?: number, metadata?: any) => void;
      page: () => void;
    };
    
    // 📈 Analytics existente (mejorado)
    analytics: {
      trackEvent: (eventName: string, parameters?: any) => void;
      trackViewItem: (item: {
        id: string;
        name: string;
        price?: number;
        category?: string;
      }) => void;
      trackAddToCart: (item: {
        id: string;
        name: string;
        price?: number;
        category?: string;
      }, quantity?: number) => void;
      trackPurchase: (
        transactionId: string,
        items: Array<{
          id: string;
          name: string;
          price?: number;
          category?: string;
          quantity?: number;
        }>,
        value: number,
        shipping?: number,
        tax?: number
      ) => void;
      trackSelectItem: (item: {
        id: string;
        name: string;
        price?: number;
        category?: string;
      }, source?: string) => void;
      trackCustomEvent: (eventName: string, parameters?: any) => void;
      trackChatEvent: (eventName: string, data?: any) => void;
      trackSiteInteraction: (action: string, element: string, value?: number) => void;
    };
    
    // 🔔 Google Analytics
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}