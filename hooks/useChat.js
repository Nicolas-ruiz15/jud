// hooks/useChat.js - HOOK OPTIMIZADO PARA CHAT
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createChatMessagesPoller, createChatStatusPoller, stopChatPoller } from '../lib/polling-manager';

// Estado inicial optimizado
const initialState = {
  isOpen: false,
  isMinimized: false,
  isLoading: false,
  isSending: false,
  error: null,
  connectionStatus: 'disconnected',
  
  // Datos del chat
  chatSession: null,
  messages: [],
  newMessage: '',
  unreadCount: 0,
  
  // Estado del sistema
  chatStatus: {
    isOnline: false,
    isEnabled: true,
    isBusinessHours: true,
    estimatedResponseTime: '2-5 minutos',
    showOnlineIndicator: false,
    hasActiveAgent: false
  }
};

export function useChat() {
  // Estados principales
  const [state, setState] = useState(initialState);
  const [lastMessageTime, setLastMessageTime] = useState('');
  
  // Referencias para cleanup
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const retryCountRef = useRef(0);
  const pollingActiveRef = useRef(false);
  
  // Constantes
  const MAX_RETRY_ATTEMPTS = 3;
  const MESSAGE_TIMEOUT = 30000;

  // Función optimizada para actualizar estado
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Función para manejar errores
  const handleError = useCallback((error, context = '') => {
    console.error(`❌ Chat error ${context}:`, error);
    updateState({ 
      error: error.message || 'Error de conexión',
      connectionStatus: 'error'
    });
  }, [updateState]);

  // Función para limpiar error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Fetch optimizado del estado del chat
  const fetchChatStatus = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        updateState({ connectionStatus: 'connecting' });
      }

      const url = `/api/chat/status${state.chatSession ? `?sessionId=${state.chatSession.sessionId}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        updateState({
          chatStatus: result.data.status,
          connectionStatus: 'connected'
        });
        
        retryCountRef.current = 0;
        return result.data;
      } else {
        throw new Error(result.message || 'Error en respuesta');
      }
    } catch (error) {
      if (!silent) {
        handleError(error, 'fetching status');
      }
      return null;
    }
  }, [state.chatSession, updateState, handleError]);

  // Inicializar chat
  const initializeChat = useCallback(async () => {
    if (state.isLoading || state.chatSession) return;
    
    updateState({ isLoading: true, connectionStatus: 'connecting' });
    clearError();

    try {
      const currentPage = typeof window !== 'undefined' ? window.location.href : '';
      const referrer = typeof document !== 'undefined' ? document.referrer : '';
      
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingPage: currentPage,
          currentPage,
          referrer,
          utmSource: new URLSearchParams(window.location.search).get('utm_source'),
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign')
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const session = {
          conversationId: result.data.conversationId,
          sessionId: result.data.sessionId,
          status: 'active',
          unreadCount: 0,
          visitor: {}
        };

        updateState({
          chatSession: session,
          connectionStatus: 'connected',
          messages: []
        });

        // Cargar mensajes iniciales
        await loadMessages(session.sessionId);
        
        console.log('✅ Chat initialized:', session.sessionId);
        return session;
      } else {
        throw new Error(result.message || 'Error iniciando chat');
      }
    } catch (error) {
      handleError(error, 'initializing chat');
      return null;
    } finally {
      updateState({ isLoading: false });
    }
  }, [state.isLoading, state.chatSession, updateState, clearError, handleError]);

  // Cargar mensajes optimizado
  const loadMessages = useCallback(async (sessionId, since = null, silent = false) => {
    if (!sessionId) return;

    try {
      const params = new URLSearchParams({ sessionId });
      if (since) params.append('since', since);

      const response = await fetch(`/api/chat/messages?${params}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const newMessages = result.data.messages || [];
        
        if (since && newMessages.length > 0) {
          // Polling incremental - agregar solo mensajes nuevos
          setState(prev => {
            const existingIds = new Set(prev.messages.map(msg => msg.id));
            const uniqueNew = newMessages.filter(msg => !existingIds.has(msg.id));
            
            if (uniqueNew.length > 0) {
              return {
                ...prev,
                messages: [...prev.messages, ...uniqueNew]
              };
            }
            return prev;
          });
        } else {
          // Carga inicial - reemplazar todos los mensajes
          updateState({ messages: newMessages });
        }

        // Actualizar timestamp del último mensaje
        if (newMessages.length > 0) {
          const latest = newMessages[newMessages.length - 1];
          setLastMessageTime(latest.timestamps.created);
        }

        if (!silent && newMessages.length > 0) {
          console.log(`📨 Messages loaded: ${newMessages.length}`);
        }
      }
    } catch (error) {
      if (!silent) {
        handleError(error, 'loading messages');
      }
    }
  }, [updateState, handleError]);

  // Enviar mensaje optimizado
  const sendMessage = useCallback(async (messageContent) => {
    if (!messageContent?.trim() || !state.chatSession || state.isSending) {
      return false;
    }

    const trimmedMessage = messageContent.trim();
    if (trimmedMessage.length > 1000) {
      handleError(new Error('Mensaje muy largo (máximo 1000 caracteres)'));
      return false;
    }

    updateState({ isSending: true });
    clearError();

    // Timeout para evitar mensajes colgados
    const timeoutId = setTimeout(() => {
      updateState({ 
        isSending: false,
        error: 'El mensaje tardó mucho. Inténtalo de nuevo.'
      });
    }, MESSAGE_TIMEOUT);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.chatSession.sessionId,
          conversationId: state.chatSession.conversationId,
          message: trimmedMessage,
          senderType: 'user'
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Recargar mensajes para obtener la respuesta
        setTimeout(() => {
          loadMessages(state.chatSession.sessionId, null, true);
        }, 500);

        console.log('✅ Message sent successfully');
        return true;
      } else {
        if (result.code === 'DUPLICATE_MESSAGE') {
          console.log('⚠️ Duplicate message ignored');
          return true;
        }
        throw new Error(result.message || 'Error enviando mensaje');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      handleError(error, 'sending message');
      return false;
    } finally {
      updateState({ isSending: false });
    }
  }, [state.chatSession, state.isSending, updateState, clearError, handleError, loadMessages]);

  // Abrir chat
  const openChat = useCallback(async () => {
    updateState({ 
      isOpen: true, 
      isMinimized: false,
      unreadCount: 0
    });
    clearError();
    
    if (!state.chatSession) {
      await initializeChat();
    }
  }, [state.chatSession, updateState, clearError, initializeChat]);

  // Cerrar chat
  const closeChat = useCallback(() => {
    updateState({ 
      isOpen: false,
      isMinimized: false 
    });
    
    // Detener polling si está activo
    if (state.chatSession && pollingActiveRef.current) {
      stopChatPoller(state.chatSession.conversationId);
      pollingActiveRef.current = false;
    }
  }, [state.chatSession, updateState]);

  // Minimizar/maximizar chat
  const toggleMinimized = useCallback(() => {
    updateState({ isMinimized: !state.isMinimized });
  }, [state.isMinimized, updateState]);

  // Scroll al final
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Focus en input
  const focusInput = useCallback(() => {
    if (inputRef.current && state.isOpen && !state.isMinimized) {
      inputRef.current.focus();
    }
  }, [state.isOpen, state.isMinimized]);

  // Limpiar chat (reset completo)
  const resetChat = useCallback(() => {
    if (state.chatSession && pollingActiveRef.current) {
      stopChatPoller(state.chatSession.conversationId);
      pollingActiveRef.current = false;
    }
    
    setState(initialState);
    setLastMessageTime('');
    retryCountRef.current = 0;
    
    console.log('🔄 Chat reset');
  }, [state.chatSession]);

  // Reintentar conexión
  const retryConnection = useCallback(async () => {
    if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
      handleError(new Error('Máximo de reintentos alcanzado'));
      return false;
    }

    retryCountRef.current++;
    console.log(`🔄 Retry attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}`);
    
    updateState({ connectionStatus: 'connecting' });
    
    const result = await fetchChatStatus();
    return !!result;
  }, [handleError, updateState, fetchChatStatus]);

  // Iniciar polling inteligente
  const startPolling = useCallback(() => {
    if (!state.chatSession || pollingActiveRef.current) return;

    console.log('🔄 Starting intelligent polling...');
    
    // Polling para mensajes
    createChatMessagesPoller(
      state.chatSession.conversationId,
      async () => {
        if (state.chatSession) {
          await loadMessages(
            state.chatSession.sessionId,
            lastMessageTime || undefined,
            true
          );
        }
      }
    );

    // Polling para estado del chat
    createChatStatusPoller(async () => {
      await fetchChatStatus(true);
    });

    pollingActiveRef.current = true;
  }, [state.chatSession, lastMessageTime, loadMessages, fetchChatStatus]);

  // Detener polling
  const stopPolling = useCallback(() => {
    if (state.chatSession && pollingActiveRef.current) {
      stopChatPoller(state.chatSession.conversationId);
      pollingActiveRef.current = false;
      console.log('⏹️ Polling stopped');
    }
  }, [state.chatSession]);

  // Efectos principales
  useEffect(() => {
    // Inicializar estado del chat al montar
    fetchChatStatus(true);
  }, [fetchChatStatus]);

  useEffect(() => {
    // Gestionar polling basado en estado del chat
    if (state.isOpen && state.chatSession && state.connectionStatus === 'connected') {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup al desmontar o cambiar dependencies
    return () => {
      if (pollingActiveRef.current) {
        stopPolling();
      }
    };
  }, [state.isOpen, state.chatSession?.sessionId, state.connectionStatus, startPolling, stopPolling]);

  useEffect(() => {
    // Auto-scroll cuando llegan mensajes nuevos
    if (state.messages.length > 0) {
      scrollToBottom();
    }
  }, [state.messages.length, scrollToBottom]);

  useEffect(() => {
    // Auto-focus cuando se abre el chat
    if (state.isOpen && !state.isMinimized) {
      setTimeout(focusInput, 100);
    }
  }, [state.isOpen, state.isMinimized, focusInput]);

  // Cleanup general al desmontar
  useEffect(() => {
    return () => {
      if (pollingActiveRef.current) {
        stopPolling();
      }
    };
  }, [stopPolling]);

  // Memoización de funciones utilitarias
  const formatTime = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  }, []);

  const isMessageFromToday = useCallback((dateString) => {
    try {
      const messageDate = new Date(dateString);
      const today = new Date();
      return messageDate.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }, []);

  // Estado computado memoizado
  const computedState = useMemo(() => ({
    // Estados básicos
    ...state,
    
    // Estados computados
    hasUnreadMessages: state.unreadCount > 0,
    isConnected: state.connectionStatus === 'connected',
    canSendMessage: state.chatSession && !state.isSending && state.connectionStatus === 'connected',
    shouldShowOnlineIndicator: state.chatStatus.showOnlineIndicator && !state.chatStatus.hasActiveAgent,
    
    // Mensajes procesados
    messagesWithTime: state.messages.map(msg => ({
      ...msg,
      formattedTime: formatTime(msg.timestamps.created),
      isFromToday: isMessageFromToday(msg.timestamps.created)
    })),
    
    // Estadísticas
    totalMessages: state.messages.length,
    userMessages: state.messages.filter(m => m.sender.type === 'user').length,
    botMessages: state.messages.filter(m => m.sender.type === 'bot').length,
    agentMessages: state.messages.filter(m => m.sender.type === 'agent').length
  }), [state, formatTime, isMessageFromToday]);

  // API pública del hook
  return {
    // Estado
    ...computedState,
    
    // Referencias
    messagesEndRef,
    inputRef,
    
    // Acciones principales
    openChat,
    closeChat,
    toggleMinimized,
    sendMessage,
    
    // Gestión de estado
    updateNewMessage: useCallback((value) => updateState({ newMessage: value }), [updateState]),
    clearError,
    resetChat,
    retryConnection,
    
    // Utilidades
    scrollToBottom,
    focusInput,
    formatTime,
    
    // Control de polling
    startPolling,
    stopPolling,
    isPollingActive: pollingActiveRef.current,
    
    // Estado de conexión
    retryCount: retryCountRef.current,
    maxRetries: MAX_RETRY_ATTEMPTS
  };
}

export default useChat;