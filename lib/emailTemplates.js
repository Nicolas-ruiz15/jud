// lib/emailTemplates.js
// Plantillas de email simplificadas con mejor manejo de errores

/**
 * Plantilla base para todos los emails
 */
const getBaseEmailTemplate = (title, contentHtml) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container { 
                background-color: white; 
                border-radius: 8px; 
                overflow: hidden; 
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); 
            }
            .header { 
                background: linear-gradient(135deg, #1e3a8a, #3730a3); 
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0; 
                font-size: 24px; 
            }
            .content { 
                padding: 30px; 
            }
            .content h2 { 
                color: #1e3a8a; 
                margin-bottom: 20px; 
            }
            .content p { 
                margin-bottom: 15px; 
                line-height: 1.6; 
            }
            .button { 
                display: inline-block; 
                background: #3730a3; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold; 
                margin: 10px 0;
            }
            .info-box { 
                background: #f0f9ff; 
                border: 1px solid #3b82f6; 
                border-left: 4px solid #3b82f6; 
                padding: 15px; 
                border-radius: 6px; 
                margin: 20px 0; 
            }
            .warning { 
                background: #fefce8; 
                border: 1px solid #f59e0b; 
                border-left: 4px solid #f59e0b; 
                padding: 15px; 
                border-radius: 6px; 
                margin: 20px 0; 
            }
            .footer { 
                background: #f9fafb; 
                text-align: center; 
                padding: 20px; 
                color: #6b7280; 
                font-size: 14px; 
                border-top: 1px solid #e5e7eb; 
            }
            .ticket-number { 
                font-size: 20px; 
                font-weight: bold; 
                color: #1e3a8a; 
                background: #f0f9ff; 
                padding: 10px; 
                border-radius: 6px; 
                text-align: center; 
                margin: 15px 0; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
                <p>Judaica Breslov Colombia</p>
            </div>
            <div class="content">
                ${contentHtml}
            </div>
            <div class="footer">
                <p><strong>Judaica Breslov Colombia</strong></p>
                <p>Tienda y Librería Judaica Online</p>
                <p>📱 WhatsApp: +57 300 929 1156</p>
                <p>📧 Email: contacto@judaicabreslovcolombia.com</p>
                <p>© ${new Date().getFullYear()} Judaica Breslov Colombia</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Plantilla para email de prueba
 */
export function getTestEmailTemplate({ testType = 'connection' }) {
  const contentHtml = `
    <h2>✅ Prueba del Sistema de Email</h2>
    
    <div class="info-box">
      <h3>🔧 Información de la Prueba</h3>
      <p><strong>Tipo:</strong> ${testType}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
      <p><strong>Servidor:</strong> ${process.env.SMTP_HOST || 'No configurado'}</p>
      <p><strong>Usuario:</strong> ${process.env.SMTP_USER || 'No configurado'}</p>
      <p><strong>Entorno:</strong> ${process.env.NODE_ENV || 'development'}</p>
    </div>

    <p>Si estás recibiendo este email, significa que:</p>
    <ul>
      <li>✅ La configuración SMTP está funcionando</li>
      <li>✅ Las credenciales de Zoho son correctas</li>
      <li>✅ El servicio de email está operativo</li>
      <li>✅ Las plantillas se generan correctamente</li>
    </ul>

    <div class="warning">
      <strong>🧪 Email de Prueba</strong><br>
      Este es un email de prueba del sistema. No requiere respuesta.
    </div>

    <p>¡El sistema de emails está listo para funcionar!</p>
  `;

  return getBaseEmailTemplate('Prueba del Sistema de Email', contentHtml);
}

/**
 * Plantilla para confirmación de ticket creado
 */
export function getTicketCreatedEmailTemplate({ ticket, autoResponse }) {
  const responseTime = {
    'high': '4-8 horas',
    'medium': '12-24 horas', 
    'low': '24-48 horas'
  }[ticket.priority] || '24 horas';

  const contentHtml = `
    <h2>¡Hemos recibido tu solicitud de soporte!</h2>
    
    <div class="ticket-number">
      🎫 Ticket: ${ticket.ticket_number}
    </div>

    <p>Estimado/a <strong>${ticket.name}</strong>,</p>
    
    <p>Tu solicitud ha sido registrada exitosamente en nuestro sistema de soporte.</p>

    <div class="info-box">
      <h3>📋 Detalles del Ticket</h3>
      <p><strong>Asunto:</strong> ${ticket.subject}</p>
      <p><strong>Tipo:</strong> ${ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1)}</p>
      <p><strong>Prioridad:</strong> ${ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Baja'}</p>
      <p><strong>Tiempo estimado de respuesta:</strong> ${responseTime}</p>
      ${ticket.order_number ? `<p><strong>📦 Pedido relacionado:</strong> ${ticket.order_number}</p>` : ''}
    </div>

    ${autoResponse ? `
    <div class="warning">
      <strong>💡 Respuesta Inicial</strong><br>
      ${autoResponse}
    </div>
    ` : ''}

    <p>Nuestro equipo revisará tu caso y te contactaremos pronto.</p>

    <p>Para contacto urgente:</p>
    <p>📱 <a href="https://wa.me/573009291156?text=Hola, tengo el ticket ${ticket.ticket_number}">WhatsApp: +57 300 929 1156</a></p>

    <p><strong>Gracias por confiar en Judaica Breslov Colombia</strong></p>
  `;

  return getBaseEmailTemplate('Confirmación de Ticket', contentHtml);
}

/**
 * Plantilla para respuesta del equipo
 */
export function getTicketResponseEmailTemplate({ ticket, responseMessage, adminName }) {
  const contentHtml = `
    <h2>Nueva respuesta a tu ticket</h2>
    
    <div class="ticket-number">
      🎫 Ticket: ${ticket.ticket_number}
    </div>

    <p>Estimado/a <strong>${ticket.name}</strong>,</p>
    
    <p>Nuestro equipo ha respondido a tu solicitud:</p>

    <div class="info-box">
      <h3>💬 Respuesta de ${adminName || 'Nuestro Equipo'}</h3>
      <div style="background: white; padding: 15px; border-radius: 6px; white-space: pre-wrap;">
${responseMessage}
      </div>
    </div>

    ${ticket.status === 'pending_customer' ? `
    <div class="warning">
      <strong>⚠️ Acción Requerida</strong><br>
      Tu respuesta es necesaria para continuar con la resolución.
    </div>
    ` : ''}

    <p>Para responder:</p>
    <p>📱 <a href="https://wa.me/573009291156?text=Respuesta al ticket ${ticket.ticket_number}">WhatsApp: +57 300 929 1156</a></p>
    <p>📧 Responde directamente a este email</p>

    <p><strong>Atentamente,<br>${adminName || 'Equipo de Soporte'}</strong></p>
  `;

  return getBaseEmailTemplate('Respuesta a tu Ticket', contentHtml);
}

/**
 * Plantilla para ticket resuelto
 */
export function getTicketResolvedEmailTemplate({ ticket, resolution }) {
  const isResolved = ticket.status === 'resolved';

  const contentHtml = `
    <h2>${isResolved ? '✅ ¡Tu ticket ha sido resuelto!' : '🔒 Tu ticket ha sido cerrado'}</h2>
    
    <div class="ticket-number">
      🎫 Ticket: ${ticket.ticket_number}
    </div>

    <p>Estimado/a <strong>${ticket.name}</strong>,</p>
    
    <p>${isResolved ? 'Tu solicitud ha sido resuelta satisfactoriamente.' : 'Tu ticket ha sido cerrado.'}</p>

    ${resolution ? `
    <div class="info-box">
      <h3>💡 Resolución</h3>
      <div style="background: white; padding: 15px; border-radius: 6px; white-space: pre-wrap;">
${resolution}
      </div>
    </div>
    ` : ''}

    <div class="info-box">
      <h3>📊 Resumen</h3>
      <p><strong>Asunto:</strong> ${ticket.subject}</p>
      <p><strong>Fecha de creación:</strong> ${new Date(ticket.created_at).toLocaleDateString('es-CO')}</p>
      <p><strong>Fecha de ${isResolved ? 'resolución' : 'cierre'}:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
    </div>

    ${isResolved ? `
    <p><strong>🌟 Califica nuestro servicio:</strong></p>
    <p>Tu opinión es importante. Contáctanos para comentarios.</p>
    ` : ''}

    <p>Para nuevas consultas:</p>
    <p>📱 WhatsApp: +57 300 929 1156</p>
    <p>📧 Email: contacto@judaicabreslovcolombia.com</p>

    <p><strong>Gracias por confiar en nosotros</strong></p>
  `;

  return getBaseEmailTemplate(isResolved ? 'Ticket Resuelto' : 'Ticket Cerrado', contentHtml);
}

/**
 * Plantilla para notificación admin
 */
export function getNewTicketAdminEmailTemplate({ ticket }) {
  const priorityEmoji = {
    'high': '🔴',
    'medium': '🟡', 
    'low': '🟢'
  }[ticket.priority] || '🟡';

  const contentHtml = `
    <h2>🎫 Nuevo Ticket de Soporte</h2>
    
    <div class="ticket-number">
      ${ticket.ticket_number} ${priorityEmoji}
    </div>

    <div class="info-box">
      <h3>👤 Cliente</h3>
      <p><strong>Nombre:</strong> ${ticket.name}</p>
      <p><strong>Email:</strong> ${ticket.email}</p>
      <p><strong>Teléfono:</strong> ${ticket.phone || 'No proporcionado'}</p>
    </div>

    <div class="info-box">
      <h3>📋 Detalles</h3>
      <p><strong>Tipo:</strong> ${ticket.type.toUpperCase()}</p>
      <p><strong>Prioridad:</strong> ${ticket.priority.toUpperCase()}</p>
      <p><strong>Asunto:</strong> ${ticket.subject}</p>
      ${ticket.order_number ? `<p><strong>📦 Pedido:</strong> ${ticket.order_number}</p>` : ''}
      ${ticket.product_name ? `<p><strong>🛍️ Producto:</strong> ${ticket.product_name}</p>` : ''}
    </div>

    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h4>📝 Descripción:</h4>
      <div style="white-space: pre-wrap; font-family: monospace; background: white; padding: 10px; border-radius: 4px;">
${ticket.description}
      </div>
    </div>

    ${ticket.priority === 'high' || ticket.type === 'quejas' ? `
    <div class="warning">
      <strong>⚠️ REQUIERE ATENCIÓN URGENTE</strong><br>
      ${ticket.priority === 'high' ? 'Alta prioridad - Responder en 4-8 horas' : ''}
      ${ticket.type === 'quejas' ? 'Queja - Escalar inmediatamente' : ''}
    </div>
    ` : ''}

    <p><strong>Acciones rápidas:</strong></p>
    <p>📱 <a href="https://wa.me/${ticket.phone?.replace(/[^\d]/g, '')}">Contactar por WhatsApp</a></p>
    <p>📧 <a href="mailto:${ticket.email}?subject=Re: Ticket ${ticket.ticket_number}">Responder por email</a></p>
    <p>🎯 <a href="${process.env.SITE_URL || 'https://www.judaicabreslovcolombia.com'}/admin/tickets/${ticket.id}">Ver en admin</a></p>

    <p><em>Generado automáticamente - ${new Date().toLocaleString('es-CO')}</em></p>
  `;

  return getBaseEmailTemplate('Nuevo Ticket de Soporte', contentHtml);
}

/**
 * Plantilla para confirmación de pedido (compatible con tu sistema existente)
 */
export function getOrderConfirmationEmailTemplate(orderDetails, customerDetails) {
  const totalAmount = parseFloat(orderDetails.total_amount).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const itemsHtml = orderDetails.items?.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.product_name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${parseFloat(item.price * item.quantity).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
    </tr>
  `).join('') || '<tr><td colspan="3">No hay items</td></tr>';

  const contentHtml = `
    <h2>¡Gracias por tu compra!</h2>
    
    <p>Hola <strong>${customerDetails.name}</strong>,</p>
    <p>Hemos recibido tu pedido #${orderDetails.order_number}.</p>
    
    <h3>📦 Detalles del Pedido:</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Producto</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Cantidad</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="background-color: #f9f9f9; font-weight: bold;">
          <td colspan="2" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total:</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${totalAmount}</td>
        </tr>
      </tbody>
    </table>
    
    ${orderDetails.shipping_address ? `
    <h3>🏠 Dirección de Envío:</h3>
    <p>${orderDetails.shipping_address.address}<br>
    ${orderDetails.shipping_address.city}, ${orderDetails.shipping_address.state || ''}</p>
    ` : ''}

    ${orderDetails.notes ? `<p><strong>Notas:</strong> ${orderDetails.notes}</p>` : ''}

    <p>Recibirás otra notificación cuando tu pedido sea enviado.</p>
    
    <p>Para cualquier consulta:</p>
    <p>📱 WhatsApp: +57 300 929 1156</p>
    <p>📧 Email: contacto@judaicabreslovcolombia.com</p>
  `;

  return getBaseEmailTemplate(`Confirmación de Pedido #${orderDetails.order_number}`, contentHtml);
}

// AGREGAR estas funciones al final de emailTemplates.js (después de las existentes)

/**
 * Plantilla para email de verificación
 */
export function getEmailVerificationTemplate({ user, verificationUrl }) {
  const contentHtml = `
    <h2>🔐 Verifica tu cuenta</h2>
    
    <p>¡Hola <strong>${user.name}</strong>!</p>
    
    <p>Gracias por registrarte en Judaica Breslov Colombia. Para completar tu registro y acceder a tu cuenta, necesitas verificar tu dirección de email.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" class="button" style="font-size: 18px; padding: 15px 30px;">
        ✅ Verificar mi Email
      </a>
    </div>

    <div class="info-box">
      <h3>🔗 Enlace alternativo</h3>
      <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace;">
        ${verificationUrl}
      </p>
    </div>

    <div class="warning">
      <strong>⚠️ Importante:</strong><br>
      • Este enlace es válido por 24 horas únicamente<br>
      • No podrás acceder a tu cuenta hasta verificar tu email<br>
      • Si no solicitaste esta cuenta, puedes ignorar este email
    </div>

    <p>Una vez verificado tu email, podrás:</p>
    <ul>
      <li>✅ Acceder a tu cuenta</li>
      <li>🛒 Realizar pedidos</li>
      <li>📞 Contactar soporte técnico</li>
      <li>📧 Recibir actualizaciones importantes</li>
    </ul>

    <p>¡Esperamos verte pronto en nuestra tienda!</p>
  `;

  return getBaseEmailTemplate('Verifica tu cuenta - Judaica Breslov Colombia', contentHtml);
}

/**
 * Plantilla para email de bienvenida (después de verificar)
 */
export function getWelcomeEmailTemplate({ user }) {
  const contentHtml = `
    <h2>🎉 ¡Bienvenido/a a Judaica Breslov Colombia!</h2>
    
    <p>¡Hola <strong>${user.name}</strong>!</p>
    
    <p>Tu cuenta ha sido verificada exitosamente. ¡Bienvenido/a a nuestra comunidad!</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.SITE_URL || 'https://www.judaicabreslovcolombia.com'}/productos" class="button" style="font-size: 18px; padding: 15px 30px;">
        🛒 Explorar Productos
      </a>
    </div>

    <div class="info-box">
      <h3>🏪 Tu cuenta está lista</h3>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Fecha de registro:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
      <p><strong>Tipo de cuenta:</strong> Cliente</p>
    </div>

    <h3>📚 ¿Qué puedes hacer ahora?</h3>
    <ul>
      <li>🔍 <strong>Explorar productos:</strong> Libros, artículos religiosos y más</li>
      <li>🛒 <strong>Realizar pedidos:</strong> Compra segura con múltiples métodos de pago</li>
      <li>📦 <strong>Seguir tus pedidos:</strong> Recibe actualizaciones en tiempo real</li>
      <li>📞 <strong>Soporte 24/7:</strong> Estamos aquí para ayudarte</li>
      <li>📧 <strong>Ofertas exclusivas:</strong> Recibe descuentos especiales</li>
    </ul>

   <div class="info-box">
  <h3>💌 ¡Bienvenido!</h3>
  <p><strong>Queremos que tu experiencia aquí sea especial desde el primer momento.</strong></p>
  <p>Descubre nuestras novedades y encuentra inspiración.</p>
  <p><em>Estamos felices de que estés aquí</em></p>
</div>


    <h3>📞 ¿Necesitas ayuda?</h3>
    <p>Nuestro equipo está listo para ayudarte:</p>
    <p>📱 <strong>WhatsApp:</strong> <a href="https://wa.me/573009291156">+57 300 929 1156</a></p>
    <p>📧 <strong>Email:</strong> <a href="mailto:contacto@judaicabreslovcolombia.com">contacto@judaicabreslovcolombia.com</a></p>
    <p>🕒 <strong>Horario:</strong> Lunes a Viernes, 8:00 AM - 6:00 PM</p>

    <p><strong>Gracias por confiar en nosotros</strong></p>
    <p><em>¡Que tengas un excelente día!</em></p>
  `;

  return getBaseEmailTemplate('¡Bienvenido/a! - Judaica Breslov Colombia', contentHtml);
}

/**
 * Plantilla para reenvío de verificación
 */
export function getResendVerificationTemplate({ user, verificationUrl }) {
  const contentHtml = `
    <h2>🔄 Nuevo enlace de verificación</h2>
    
    <p>¡Hola <strong>${user.name}</strong>!</p>
    
    <p>Hemos generado un nuevo enlace de verificación para tu cuenta como lo solicitaste.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" class="button" style="font-size: 18px; padding: 15px 30px;">
        ✅ Verificar mi Email
      </a>
    </div>

    <div class="info-box">
      <h3>🔗 Enlace alternativo</h3>
      <p>Si el botón no funciona, copia y pega este enlace:</p>
      <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace;">
        ${verificationUrl}
      </p>
    </div>

    <div class="warning">
      <strong>⚠️ Importante:</strong><br>
      • Este nuevo enlace reemplaza al anterior<br>
      • Válido por 24 horas únicamente<br>
      • Solo puedes reenviar 3 veces por día
    </div>

    <p>Una vez verificado, podrás acceder completamente a tu cuenta.</p>

    <p>Si tienes problemas, contáctanos:</p>
    <p>📱 WhatsApp: +57 300 929 1156</p>
  `;

  return getBaseEmailTemplate('Nuevo enlace de verificación - Judaica Breslov Colombia', contentHtml);
}
/**
 * Plantilla específica para transferencia bancaria
 */
export function getBankTransferEmailTemplate(orderDetails, customerDetails) {
  const totalAmount = parseFloat(orderDetails.total_amount).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const itemsHtml = orderDetails.items?.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.product_name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${parseFloat(item.price * item.quantity).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
    </tr>
  `).join('') || '<tr><td colspan="3">No hay items</td></tr>';

  const contentHtml = `
    <h2>¡Hemos recibido tu pedido!</h2>
    
    <p>Hola <strong>${customerDetails.name}</strong>,</p>
    <p>Hemos recibido tu pedido #${orderDetails.order_number} y está pendiente de pago por transferencia bancaria.</p>
    
    <div class="warning">
      <strong>⚠️ Instrucciones de Pago</strong><br>
      Para completar tu pedido, realiza la transferencia por el valor exacto y envíanos el comprobante.
    </div>
    
    <h3>📦 Resumen del Pedido:</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Producto</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Cantidad</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="background-color: #f9f9f9; font-weight: bold;">
          <td colspan="2" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total a Pagar:</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${totalAmount}</td>
        </tr>
      </tbody>
    </table>
    
    <h3>🏦 Cuentas Bancarias</h3>
    
    <div class="info-box" style="margin: 20px 0;">
      <h4>Bancolombia</h4>
      <p><strong>Tipo:</strong> Cuenta Ahorros</p>
      <p><strong>Número:</strong> 372 000 264 71</p>
      <p><strong>Titular:</strong> Mariann Julieth Riaño Castillo</p>
    </div>
    
    <div class="info-box" style="margin: 20px 0;">
      <h4>Banco Davivienda</h4>
      <p><strong>Tipo:</strong> Cuenta de Ahorros</p>
      <p><strong>Número:</strong> 4884 1480 1859</p>
      <p><strong>Titular:</strong> Nicolas Mateo Ruiz Gomez</p>
    </div>
    
    <h3>📝 Instrucciones para el Pago</h3>
    <ol>
      <li>Realiza la transferencia por el valor exacto de <strong>${totalAmount}</strong></li>
      <li>En el concepto o referencia incluye: <strong>${orderDetails.order_number}</strong></li>
      <li>Envía el comprobante de pago a <strong>contacto@judaicabreslovcolombia.com</strong></li>
      <li>Incluye en el email tu número de orden y nombre completo</li>
      <li>Una vez confirmemos el pago, procesaremos tu pedido</li>
    </ol>
    
    ${orderDetails.shipping_address ? `
    <h3>🏠 Dirección de Envío:</h3>
    <p>${orderDetails.shipping_address.address}<br>
    ${orderDetails.shipping_address.city}, ${orderDetails.shipping_address.state || ''}</p>
    ` : ''}

    ${orderDetails.notes ? `<p><strong>Notas:</strong> ${orderDetails.notes}</p>` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:contacto@judaicabreslovcolombia.com?subject=Comprobante de Pago - Orden ${orderDetails.order_number}&body=Adjunto el comprobante de pago para la orden ${orderDetails.order_number}.%0A%0ANombre: ${customerDetails.name}" 
         style="display: inline-block; background: #3730a3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        📧 Enviar Comprobante
      </a>
    </div>
    
    <p>¡Gracias por tu preferencia!</p>
  `;

  return getBaseEmailTemplate(`Instrucciones de Pago - Pedido #${orderDetails.order_number}`, contentHtml);
}
/**
 * Plantilla para actualización de estado
 */
export function getStatusUpdateEmailTemplate(order, customMessage) {
  const statusLabels = {
    pending: 'Pendiente',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };

  const contentHtml = `
    <h2>📋 Actualización de tu pedido</h2>
    
    <p>Hola <strong>${order.customer_first_name || 'Cliente'}</strong>,</p>
    <p>Tu pedido <strong>#${order.order_number}</strong> ha sido actualizado.</p>
    
    <div class="info-box">
      <h3>Estado actual: ${statusLabels[order.status] || order.status}</h3>
      ${customMessage ? `<p><strong>Información adicional:</strong><br>${customMessage}</p>` : ''}
    </div>
    
    <p><strong>Total del pedido:</strong> ${parseFloat(order.total_amount || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
    
    <p>¡Gracias por confiar en Judaica Breslov Colombia!</p>
  `;

  return getBaseEmailTemplate(`Actualización de Pedido #${order.order_number}`, contentHtml);
}

/**
 * Plantilla para confirmación de pago
 */
export function getPaymentConfirmationEmailTemplate(order) {
  const contentHtml = `
    <h2>✅ ¡Pago confirmado!</h2>
    
    <p>Hola <strong>${order.customer_first_name || 'Cliente'}</strong>,</p>
    <p>Hemos confirmado el pago de tu pedido <strong>#${order.order_number}</strong>.</p>
    
    <div class="info-box">
      <h3>💳 Detalles del pago</h3>
      <p><strong>Total pagado:</strong> ${parseFloat(order.total_amount || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
      <p><strong>Método:</strong> ${order.payment_method || 'No especificado'}</p>
      ${order.payment_reference ? `<p><strong>Referencia:</strong> ${order.payment_reference}</p>` : ''}
      ${order.epayco_transaction_id ? `<p><strong>ID ePayco:</strong> ${order.epayco_transaction_id}</p>` : ''}
    </div>
    
    <p>Ahora procederemos a preparar tu pedido para el envío.</p>
    <p>¡Gracias por confiar en Judaica Breslov Colombia!</p>
  `;

  return getBaseEmailTemplate(`Pago Confirmado - Pedido #${order.order_number}`, contentHtml);
}

/**
 * Plantilla para notificación de envío
 */
export function getShippedEmailTemplate(order, trackingInfo) {
  const contentHtml = `
    <h2>🚚 ¡Tu pedido está en camino!</h2>
    
    <p>Hola <strong>${order.customer_first_name || 'Cliente'}</strong>,</p>
    <p>Tu pedido <strong>#${order.order_number}</strong> ha sido enviado y está en camino.</p>
    
    <div class="info-box">
      <h3>📦 Información del envío</h3>
      ${trackingInfo ? `<p><strong>Información de seguimiento:</strong><br>${trackingInfo}</p>` : ''}
      <p><strong>Total del pedido:</strong> ${parseFloat(order.total_amount || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
    </div>
    
    <p>Recibirás otra notificación cuando tu pedido sea entregado.</p>
    <p>¡Gracias por tu paciencia!</p>
  `;

  return getBaseEmailTemplate(`Pedido Enviado #${order.order_number}`, contentHtml);
}

/**
 * Plantilla para notificación de entrega
 */
export function getDeliveredEmailTemplate(order) {
  const contentHtml = `
    <h2>✅ ¡Pedido entregado!</h2>
    
    <p>Hola <strong>${order.customer_first_name || 'Cliente'}</strong>,</p>
    <p>Tu pedido <strong>#${order.order_number}</strong> ha sido entregado exitosamente.</p>
    
    <div class="info-box">
      <h3>🎉 ¡Esperamos que disfrutes tus productos!</h3>
      <p>Si tienes alguna pregunta o necesitas soporte, no dudes en contactarnos.</p>
      <p><strong>Total del pedido:</strong> ${parseFloat(order.total_amount || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
    </div>
    
    <div class="info-box" style="background: #fef3c7;">
      <h3>⭐ Califica tu experiencia</h3>
      <p>Tu opinión es muy importante para nosotros. Si tienes un momento, nos encantaría conocer tu experiencia.</p>
    </div>
    
    <p>¡Gracias por confiar en Judaica Breslov Colombia!</p>
  `;

  return getBaseEmailTemplate(`Pedido Entregado #${order.order_number}`, contentHtml);
}

/**
 * Plantilla para email personalizado
 */
export function getCustomEmailTemplate(order, message, customerName) {
  const contentHtml = `
    <h2>✉️ Mensaje sobre tu pedido #${order.order_number}</h2>
    
    <p>Hola <strong>${customerName || order.customer_first_name || 'Cliente'}</strong>,</p>
    
    <div class="info-box">
      <div style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
    </div>
    
    <p><strong>Número de pedido:</strong> #${order.order_number}</p>
    <p><strong>Total:</strong> ${parseFloat(order.total_amount || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
    
    <p>¡Gracias por confiar en Judaica Breslov Colombia!</p>
  `;

  return getBaseEmailTemplate(`Mensaje sobre tu pedido #${order.order_number}`, contentHtml);
}

/**
 * Plantilla para email al administrador cuando llega un nuevo mensaje de contacto
 */
export function getContactFormAdminEmailTemplate(contactData, messageId) {
  const typeEmojis = {
    'general': '💬',
    'support': '🛠️',
    'business': '🤝',
    'product': '📦'
  };

  const typeLabels = {
    'general': 'Consulta General',
    'support': 'Soporte Técnico', 
    'business': 'Colaboración Comercial',
    'product': 'Consulta sobre Producto'
  };

  const emoji = typeEmojis[contactData.type] || '💬';
  const typeLabel = typeLabels[contactData.type] || 'Consulta General';

  const contentHtml = `
    <h2>💌 Nuevo mensaje de contacto</h2>
    
    <div class="ticket-number">
      MSG-${messageId} ${emoji}
    </div>

    <div class="info-box">
      <h3>👤 Información del Cliente</h3>
      <p><strong>Nombre:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Teléfono:</strong> ${contactData.phone || 'No proporcionado'}</p>
    </div>

    <div class="info-box">
      <h3>📋 Detalles del Mensaje</h3>
      <p><strong>Tipo:</strong> ${typeLabel}</p>
      <p><strong>Asunto:</strong> ${contactData.subject || 'Sin asunto específico'}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
    </div>

    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h4>📝 Mensaje:</h4>
      <div style="white-space: pre-wrap; font-family: Arial, sans-serif; background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #3730a3;">
${contactData.message}
      </div>
    </div>

    ${contactData.type === 'business' ? `
    <div class="warning">
      <strong>🤝 OPORTUNIDAD COMERCIAL</strong><br>
      Este mensaje podría ser una oportunidad de negocio. Responder con prioridad.
    </div>
    ` : ''}

    ${contactData.type === 'support' ? `
    <div class="info-box">
      <strong>🛠️ SOPORTE TÉCNICO</strong><br>
      El cliente necesita asistencia técnica. Tiempo de respuesta recomendado: 12-24 horas.
    </div>
    ` : ''}

    <p><strong>Acciones rápidas:</strong></p>
    <p>📱 <a href="https://wa.me/${contactData.phone?.replace(/[^\d]/g, '')}?text=Hola ${contactData.name}, recibimos tu mensaje (MSG-${messageId}) y queremos ayudarte">Contactar por WhatsApp</a></p>
    <p>📧 <a href="mailto:${contactData.email}?subject=Re: ${contactData.subject || 'Tu consulta'} - MSG-${messageId}">Responder por email</a></p>

    <div class="footer" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p><em>Mensaje recibido automáticamente - ${new Date().toLocaleString('es-CO')}</em></p>
      <p><strong>ID de referencia:</strong> MSG-${messageId}</p>
    </div>
  `;

  return getBaseEmailTemplate('Nuevo Mensaje de Contacto', contentHtml);
}

/**
 * Plantilla para email de confirmación al usuario
 */
export function getContactConfirmationEmailTemplate(contactData, messageId) {
  const responseTime = {
    'general': '24-48 horas',
    'support': '12-24 horas',
    'business': '12-24 horas', 
    'product': '24 horas'
  }[contactData.type] || '24-48 horas';

  const typeEmojis = {
    'general': '💬',
    'support': '🛠️',
    'business': '🤝',
    'product': '📦'
  };

  const typeLabels = {
    'general': 'Consulta General',
    'support': 'Soporte Técnico',
    'business': 'Colaboración Comercial',
    'product': 'Consulta sobre Producto'
  };

  const emoji = typeEmojis[contactData.type] || '💬';
  const typeLabel = typeLabels[contactData.type] || 'Consulta General';

  const contentHtml = `
    <h2>¡Hemos recibido tu mensaje!</h2>
    
    <div class="ticket-number">
      📨 Referencia: MSG-${messageId}
    </div>

    <p>Estimado/a <strong>${contactData.name}</strong>,</p>
    
    <p>Gracias por contactarnos. Hemos recibido tu mensaje y nuestro equipo lo revisará a la brevedad.</p>

    <div class="info-box">
      <h3>📋 Resumen de tu consulta</h3>
      <p><strong>Tipo:</strong> ${emoji} ${typeLabel}</p>
      <p><strong>Asunto:</strong> ${contactData.subject || 'Consulta general'}</p>
      <p><strong>Tiempo estimado de respuesta:</strong> ${responseTime}</p>
      <p><strong>Número de referencia:</strong> MSG-${messageId}</p>
    </div>

    ${contactData.type === 'support' ? `
    <div class="info-box" style="background: #fef3cd;">
      <h3>🛠️ Soporte Técnico</h3>
      <p>Tu consulta de soporte técnico ha sido priorizada. Nuestro equipo especializado la revisará pronto.</p>
      <p>Para asistencia inmediata, puedes contactarnos por WhatsApp.</p>
    </div>
    ` : ''}

    ${contactData.type === 'business' ? `
    <div class="info-box" style="background: #f0f9ff;">
      <h3>🤝 Colaboración Comercial</h3>
      <p>Gracias por tu interés en colaborar con nosotros. Nuestro equipo comercial revisará tu propuesta y te contactará pronto.</p>
    </div>
    ` : ''}

    <h3>📞 Información de Contacto</h3>
    <div class="info-box">
      <p><strong>📱 WhatsApp:</strong> <a href="https://wa.me/573009291156?text=Hola, tengo la referencia MSG-${messageId}">+57 300 929 1156</a></p>
      <p><strong>📧 Email:</strong> <a href="mailto:contacto@judaicabreslovcolombia.com">contacto@judaicabreslovcolombia.com</a></p>
      <p><strong>🕒 Horarios:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Domingo - Jueves: 9:00 AM - 6:00 PM</li>
        <li>Viernes: 9:00 AM - 2:00 PM</li>
        <li>Sábado: Cerrado</li>
      </ul>
      <p style="font-size: 12px; color: #666;"><em>* Horarios según el calendario judío</em></p>
    </div>

    <div class="warning">
      <strong>💡 Tip:</strong> Guarda este número de referencia <strong>MSG-${messageId}</strong> para futuras consultas relacionadas.
    </div>

    <p>Mientras tanto, te invitamos a explorar nuestros productos en <a href="https://www.judaicabreslovcolombia.com">nuestra tienda online</a>.</p>

    <p><strong>Gracias por confiar en Judaica Breslov Colombia</strong></p>
    <p><em>¡Que tengas un excelente día!</em></p>
  `;

  return getBaseEmailTemplate('Confirmación de Mensaje Recibido', contentHtml);
}

/**
 * Plantilla para bienvenida al newsletter
 */
export function getNewsletterWelcomeTemplate(subscriberData) {
  const { email, name = 'Suscriptor' } = subscriberData;
  
  const contentHtml = `
    <h2>🎉 ¡Bienvenido al Newsletter!</h2>
    
    <p>¡Hola <strong>${name}</strong>!</p>
    
    <p>Gracias por suscribirte a nuestro newsletter. Ahora recibirás contenido exclusivo directamente en tu bandeja de entrada.</p>

    <div class="info-box">
        <h3>📬 Lo que recibirás:</h3>
        <ul>
            <li>🆕 Nuevos productos judaicos auténticos</li>
            <li>💰 Ofertas especiales exclusivas</li>
            <li>📚 Contenido espiritual de Breslov</li>
            <li>🎁 Descuentos especiales</li>
            <li>📦 Novedades de la tienda</li>
        </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.SITE_URL || 'https://www.judaicabreslovcolombia.com'}/productos" class="button">
            🛍️ Explorar Productos
        </a>
    </div>

    <p>¡Estamos emocionados de tenerte en nuestra comunidad!</p>
    
    <p><strong>Bendiciones,<br>Equipo de Judaica Breslov Colombia</strong></p>
  `;

  return getBaseEmailTemplate('¡Bienvenido al Newsletter!', contentHtml);
}

/**
 * Plantilla para notificación admin de newsletter
 */
export function getNewsletterAdminTemplate(subscriberData) {
  const { email, name = 'Suscriptor' } = subscriberData;
  
  const contentHtml = `
    <h2>📬 Nueva Suscripción al Newsletter</h2>
    
    <div class="ticket-number">
        📧 NEWSLETTER-${Date.now()}
    </div>

    <div class="info-box">
        <h3>👤 Nuevo Suscriptor</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
        <p><strong>Origen:</strong> Footer del sitio web</p>
    </div>

    <p>¡Tenemos un nuevo suscriptor interesado en nuestros productos!</p>
    
    <p><strong>Acciones rápidas:</strong></p>
    <p>📱 <a href="https://wa.me/573009291156?text=Nuevo suscriptor: ${email}">WhatsApp</a></p>
    <p>📧 <a href="mailto:${email}?subject=¡Bienvenido!">Contactar</a></p>
  `;

  return getBaseEmailTemplate('Nueva Suscripción al Newsletter', contentHtml);
}
export { getBaseEmailTemplate };