export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'yellow' },
  { value: 'processing', label: 'Procesando', color: 'blue' },
  { value: 'shipped', label: 'Enviado', color: 'purple' },
  { value: 'delivered', label: 'Entregado', color: 'green' },
  { value: 'cancelled', label: 'Cancelado', color: 'red' },
  { value: 'refunded', label: 'Reembolsado', color: 'gray' }
];

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'yellow' },
  { value: 'completed', label: 'Completado', color: 'green' },
  { value: 'failed', label: 'Fallido', color: 'red' },
  { value: 'refunded', label: 'Reembolsado', color: 'gray' }
];

export const PRODUCT_STATUSES = [
  { value: 'active', label: 'Activo', color: 'green' },
  { value: 'inactive', label: 'Inactivo', color: 'gray' },
  { value: 'draft', label: 'Borrador', color: 'yellow' }
];

export const STOCK_STATUSES = [
  { value: 'in_stock', label: 'En stock', color: 'green' },
  { value: 'out_of_stock', label: 'Agotado', color: 'red' },
  { value: 'on_backorder', label: 'Pedido pendiente', color: 'yellow' }
];

export const ADMIN_PERMISSIONS = {
  PRODUCTS: {
    VIEW: 'products.view',
    CREATE: 'products.create',
    EDIT: 'products.edit',
    DELETE: 'products.delete'
  },
  ORDERS: {
    VIEW: 'orders.view',
    EDIT: 'orders.edit',
    DELETE: 'orders.delete'
  },
  USERS: {
    VIEW: 'users.view',
    CREATE: 'users.create',
    EDIT: 'users.edit',
    DELETE: 'users.delete'
  },
  SETTINGS: {
    VIEW: 'settings.view',
    EDIT: 'settings.edit'
  }
};