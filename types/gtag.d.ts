// types/gtag.d.ts
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'consent',
      targetId: string | Date,
      config?: {
        page_path?: string;
        page_title?: string;
        page_location?: string;
        user_id?: string;
        custom_map?: Record<string, string>;
        [key: string]: any;
      }
    ) => void;
    dataLayer: any[];
    analytics?: {
      trackEvent: (eventName: string, parameters: any) => void;
      trackViewItem: (item: any) => void;
      trackAddToCart: (item: any, quantity?: number) => void;
      trackRemoveFromCart: (item: any, quantity?: number) => void;
      trackBeginCheckout: (items: any[], value: number) => void;
      trackPurchase: (transactionId: string, items: any[], value: number, shipping?: number, tax?: number) => void;
      trackSearch: (searchTerm: string, results?: number) => void;
      trackViewItemList: (items: any[], listName: string) => void;
      trackSelectItem: (item: any, listName: string) => void;
      trackCustomEvent: (eventName: string, parameters: any) => void;
      setUserId: (userId: string) => void;
      trackPageView: (pagePath: string, pageTitle: string) => void;
    };
  }
}

// Tipos para eventos de Google Analytics 4
export interface GAEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
  items?: GAItem[];
  [key: string]: any;
}

export interface GAItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_brand?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
  coupon?: string;
  discount?: number;
  affiliation?: string;
  item_list_name?: string;
  item_list_id?: string;
  promotion_id?: string;
  promotion_name?: string;
  creative_name?: string;
  creative_slot?: string;
  location_id?: string;
}

export interface GAConfig {
  page_title?: string;
  page_path?: string;
  page_location?: string;
  user_id?: string;
  currency?: string;
  custom_map?: Record<string, string>;
  send_page_view?: boolean;
  client_storage?: 'none' | 'localStorage';
  anonymize_ip?: boolean;
  allow_google_signals?: boolean;
  allow_ad_personalization_signals?: boolean;
}

export interface GAEcommerceEvent {
  currency: string;
  value: number;
  transaction_id?: string;
  shipping?: number;
  tax?: number;
  coupon?: string;
  items: GAItem[];
}

export interface GAPromotionEvent {
  promotion_id: string;
  promotion_name: string;
  creative_name?: string;
  creative_slot?: string;
  location_id?: string;
  items?: GAItem[];
}

export interface GASearchEvent {
  search_term: string;
  number_of_results?: number;
}

export interface GAShareEvent {
  method: string;
  content_type: string;
  item_id: string;
}

export interface GALoginEvent {
  method: string;
}

export interface GASignUpEvent {
  method: string;
}

export interface GATimingEvent {
  name: string;
  value: number;
  event_category?: string;
  event_label?: string;
}

export interface GAExceptionEvent {
  description?: string;
  fatal?: boolean;
}

// Funciones helper para tipado
export function trackEvent(
  eventName: string,
  parameters: Partial<GAEvent>
): void;

export function trackPurchase(
  transactionId: string,
  value: number,
  items: GAItem[],
  currency?: string,
  shipping?: number,
  tax?: number
): void;

export function trackAddToCart(
  item: GAItem,
  currency?: string
): void;

export function trackRemoveFromCart(
  item: GAItem,
  currency?: string
): void;

export function trackViewItem(
  item: GAItem,
  currency?: string
): void;

export function trackBeginCheckout(
  items: GAItem[],
  value: number,
  currency?: string
): void;

export function trackSearch(
  searchTerm: string,
  numberOfResults?: number
): void;

export function trackShare(
  method: string,
  contentType: string,
  itemId: string
): void;

export function trackLogin(method: string): void;

export function trackSignUp(method: string): void;

export function trackPromotion(
  promotionId: string,
  promotionName: string,
  creativeName?: string,
  creativeSlot?: string
): void;

export {};