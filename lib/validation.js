// lib/validation.js - Implementación de validación de datos con Zod
const z = require('zod');

// Esquema para validación de usuario
const userSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).optional(),
  phone: z.string().optional(),
});

// Esquema para validación de dirección
const addressSchema = z.object({
  street: z.string().min(3, { message: 'La calle debe tener al menos 3 caracteres' }),
  number: z.string().min(1, { message: 'El número es requerido' }),
  city: z.string().min(2, { message: 'La ciudad debe tener al menos 2 caracteres' }),
  state: z.string().min(2, { message: 'El estado/provincia debe tener al menos 2 caracteres' }),
  zipCode: z.string().min(3, { message: 'El código postal debe tener al menos 3 caracteres' }),
  country: z.string().min(2, { message: 'El país debe tener al menos 2 caracteres' }),
  additionalInfo: z.string().optional(),
});

// Esquema para validación de producto
const productSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
  price: z.number().positive({ message: 'El precio debe ser positivo' }),
  description: z.string().optional(),
  stock: z.number().int().nonnegative({ message: 'El stock no puede ser negativo' }),
  category_id: z.number().int().positive({ message: 'La categoría es requerida' }),
  images: z.array(z.string().url({ message: 'URL de imagen inválida' })).optional(),
});

// Esquema para validación de categoría
const categorySchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  description: z.string().optional(),
  parent_id: z.number().int().nonnegative({ message: 'El ID de categoría padre debe ser no negativo' }).optional(),
  slug: z.string().min(2, { message: 'El slug debe tener al menos 2 caracteres' }).optional(),
});

// Esquema para validación de orden
const orderSchema = z.object({
  user_id: z.number().int().positive({ message: 'El ID de usuario es requerido' }),
  items: z.array(
    z.object({
      product_id: z.number().int().positive({ message: 'El ID de producto es requerido' }),
      quantity: z.number().int().positive({ message: 'La cantidad debe ser positiva' }),
      price: z.number().positive({ message: 'El precio debe ser positivo' }),
    })
  ).min(1, { message: 'La orden debe tener al menos un producto' }),
  shipping_address_id: z.number().int().positive({ message: 'La dirección de envío es requerida' }),
  payment_method: z.string().min(2, { message: 'El método de pago es requerido' }),
  status: z.string().optional(),
  notes: z.string().optional(),
});

// Esquema para validación de pago
const paymentSchema = z.object({
  order_id: z.number().int().positive({ message: 'El ID de orden es requerido' }),
  amount: z.number().positive({ message: 'El monto debe ser positivo' }),
  currency: z.string().length(3, { message: 'La moneda debe tener 3 caracteres (ej: COP)' }),
  payment_method: z.string().min(2, { message: 'El método de pago es requerido' }),
  status: z.string().optional(),
  transaction_id: z.string().optional(),
  payment_date: z.date().optional(),
});

// Esquema para validación de contacto
const contactSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  subject: z.string().min(3, { message: 'El asunto debe tener al menos 3 caracteres' }),
  message: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres' }),
  phone: z.string().optional(),
});

// Esquema para validación de ePayco
const epaycoTokenSchema = z.object({
  card_number: z.string().regex(/^\d{16}$/, { message: 'Número de tarjeta inválido' }),
  card_holder: z.string().min(5, { message: 'Nombre del titular inválido' }),
  card_expiry_month: z.string().regex(/^(0[1-9]|1[0-2])$/, { message: 'Mes de expiración inválido' }),
  card_expiry_year: z.string().regex(/^\d{2}$/, { message: 'Año de expiración inválido' }),
  card_cvc: z.string().regex(/^\d{3,4}$/, { message: 'CVC inválido' }),
});

const epaycoPaymentSchema = z.object({
  token_card: z.string().min(10, { message: 'Token de tarjeta inválido' }),
  customer_name: z.string().min(5, { message: 'Nombre del cliente inválido' }),
  customer_email: z.string().email({ message: 'Email inválido' }),
  customer_phone: z.string().min(7, { message: 'Teléfono inválido' }),
  customer_dni: z.string().min(5, { message: 'Documento de identidad inválido' }),
  order_id: z.string().min(1, { message: 'ID de orden inválido' }),
  amount: z.number().positive({ message: 'El monto debe ser positivo' }),
  currency: z.string().length(3, { message: 'La moneda debe tener 3 caracteres (ej: COP)' }),
  description: z.string().min(5, { message: 'Descripción inválida' }),
  ip: z.string().ip({ message: 'IP inválida' }).optional(),
});

const epaycoConfirmationSchema = z.object({
  x_ref_payco: z.string().min(1, { message: 'Referencia de pago inválida' }),
  x_transaction_id: z.string().min(1, { message: 'ID de transacción inválido' }),
  x_amount: z.string().min(1, { message: 'Monto inválido' }),
  x_currency_code: z.string().length(3, { message: 'Código de moneda inválido' }),
  x_signature: z.string().min(10, { message: 'Firma inválida' }),
  x_cod_response: z.string().min(1, { message: 'Código de respuesta inválido' }),
  x_transaction_state: z.string().min(1, { message: 'Estado de transacción inválido' }),
  x_extra1: z.string().optional(),
  x_extra2: z.string().optional(),
  x_extra3: z.string().optional(),
});

// Función para validar datos
const validate = (schema, data) => {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      return { success: false, errors };
    }
    return { success: false, errors: [{ path: 'unknown', message: 'Error de validación desconocido' }] };
  }
};

// Middleware para validar solicitudes
const validateRequest = (schema) => {
  return (req, res, next) => {
    const result = validate(schema, req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: result.errors });
    }
    req.validatedData = result.data;
    next();
  };
};

module.exports = {
  validate,
  validateRequest,
  userSchema,
  addressSchema,
  productSchema,
  categorySchema,
  orderSchema,
  paymentSchema,
  contactSchema,
  epaycoTokenSchema,
  epaycoPaymentSchema,
  epaycoConfirmationSchema
};