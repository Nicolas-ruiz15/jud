// server/websocket.js - Versión mejorada
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const wss = new WebSocket.Server({ port: 3001 });

// Almacenamiento de conexiones por usuario
const connections = new Map();

console.log('🚀 Servidor WebSocket mejorado iniciado en ws://localhost:3001');

wss.on('connection', (ws, req) => {
  console.log('🔗 Nueva conexión WebSocket');
  
  let userId = null;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      // Manejar autenticación
      if (data.type === 'auth') {
        try {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
          userId = decoded.userId;
          connections.set(userId, ws);
          console.log(`✅ Usuario ${userId} autenticado en WebSocket`);
          
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Autenticación exitosa'
          }));
        } catch (authError) {
          ws.send(JSON.stringify({
            type: 'auth_error',
            message: 'Token inválido'
          }));
          ws.close();
        }
        return;
      }
      
      // Si no está autenticado, ignorar mensaje
      if (!userId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'No autenticado'
        }));
        return;
      }
      
      console.log('📨 Mensaje recibido:', data.type);
      
      // Manejar diferentes tipos de mensajes
      switch (data.type) {
        case 'new_visitor':
          // Enviar a todos los admins conectados
          broadcastToAdmins({
            type: 'visitor_update',
            visitor: data.visitor
          });
          break;
          
        case 'chat_message':
          // Enviar a la conversación específica
          broadcastToConversation(data.conversationId, {
            type: 'new_message',
            message: data.message
          });
          break;
          
        case 'admin_action':
          // Enviar a otros admins
          broadcastToOtherAdmins(userId, {
            type: 'admin_update',
            action: data.action
          });
          break;
      }
      
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error procesando mensaje'
      }));
    }
  });
  
  ws.on('close', () => {
    if (userId) {
      connections.delete(userId);
      console.log(`🔚 Usuario ${userId} desconectado`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error);
  });
});

function broadcastToAdmins(data) {
  connections.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

function broadcastToOtherAdmins(currentUserId, data) {
  connections.forEach((ws, userId) => {
    if (userId !== currentUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

function broadcastToConversation(conversationId, data) {
  // Implementar lógica para enviar a usuarios en la misma conversación
  // Esto requeriría un mapeo de conversaciones a usuarios
  connections.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...data,
        conversationId
      }));
    }
  });
}