// components/LiveChatWidget-UltraMasterCompatible.tsx - COMPATIBLE CON ULTRA MASTER JUDAICA ENGINE

import { useState, useEffect, useRef, useCallback } from 'react';

// Interfaces actualizadas para Ultra Master Engine
interface UltraEngineResponse {
  success: boolean;
  response: {
    text: string;
    intent: string;
    confidence: number;
    requiresHuman: boolean;
    suggestions: string[];
    products: Array<{
      id: number;
      name: string;
      price: number;
      display_price: number;
      url?: string;
      category?: string;
    }>;
    metadata: {
      processingTime: number;
      sessionId: string;
      conversationId: number | string;
      isJudaicaSpecialized: boolean;
      breslovContent: boolean;
      kosherValidated: boolean;
      ultraMasterEngine: boolean;
      engineVersion: string;
      databaseStatus?: DatabaseStatus;
    };
  };
  context: {
    sessionId: string;
    conversationId: number | string;
    lastIntent: string;
    messageCount: number;
  };
}

interface Message {
  id: number;
  conversationId: number | string;
  sessionId: string;
  sender: {
    type: 'user' | 'bot' | 'agent' | 'system';
    id?: string;
    name: string;
    avatar: string;
  };
  message: {
    type: 'text' | 'image' | 'file' | 'system';
    content: string;
    html?: string;
  };
  status: {
    isRead: boolean;
    isEdited: boolean;
    delivery: 'sent' | 'delivered' | 'read' | 'failed';
    isAutomated: boolean;
  };
  ai?: {
    confidence: number;
    requiresHuman: boolean;
    intent: string;
    products?: Array<{
      id: number;
      name: string;
      price: number;
      display_price?: number;
      url?: string;
      category?: string;
    }>;
    suggestions?: string[];
    quality?: {
      isEmergencyResponse: boolean;
      isErrorResponse: boolean;
      ultraMasterEngine?: boolean;
      engineVersion?: string;
    };
  };
  timestamps: {
    created: string;
    updated: string;
    read?: string;
  };
}

interface ChatSession {
  conversationId: number | string;
  sessionId: string;
  status: 'active' | 'pending' | 'closed';
  messageCount: number;
  existing?: boolean;
  ultraMasterEngine?: boolean;
  databaseStatus?: DatabaseStatus | null;
}

interface DatabaseStatus {
  connected: boolean | null;
  checkedAt?: string | null;
  latency?: number | null;
  error?: string | null;
  source?: string | null;
}

const UltraJudaicaChatWidget: React.FC = () => {
  // Estados principales
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [ultraEngineStatus, setUltraEngineStatus] = useState<'active' | 'emergency' | 'offline'>('active');

  // Estados para polling optimizado
  const [lastEngineVersion, setLastEngineVersion] = useState<string>('');
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);

  // Referencias
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // FUNCIONES DE PERSISTENCIA MEJORADAS

  const saveSessionToStorage = useCallback((session: ChatSession) => {
    try {
      localStorage.setItem('judaica_ultra_chat_session', JSON.stringify({
        ...session,
        lastActivity: new Date().toISOString(),
        ultraMasterEngine: true
      }));
    } catch (error) {
      console.warn('No se pudo guardar sesión Ultra Master en localStorage');
    }
  }, []);

  const loadSessionFromStorage = useCallback((): ChatSession | null => {
    try {
      const stored = localStorage.getItem('judaica_ultra_chat_session');
      if (stored) {
        const session = JSON.parse(stored);
        const lastActivity = new Date(session.lastActivity);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
        
        if (diffMinutes < 120) { // 2 horas de validez
          return { ...session, ultraMasterEngine: true };
        } else {
          localStorage.removeItem('judaica_ultra_chat_session');
        }
      }
    } catch (error) {
      console.warn('Error cargando sesión Ultra Master:', error);
      localStorage.removeItem('judaica_ultra_chat_session');
    }
    return null;
  }, []);

  const saveMessagesToStorage = useCallback((messages: Message[]) => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('judaica_ultra_chat_messages', JSON.stringify(messages.slice(-20)));
      }
    } catch (error) {
      console.warn('No se pudieron guardar mensajes Ultra Master');
    }
  }, []);

  const loadMessagesFromStorage = useCallback((): Message[] => {
    try {
      const stored = localStorage.getItem('judaica_ultra_chat_messages');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Error cargando mensajes Ultra Master:', error);
      return [];
    }
  }, []);

  // PROCESAMIENTO DE RESPUESTA DEL ULTRA MASTER ENGINE

  const processUltraEngineResponse = useCallback((response: UltraEngineResponse): Message => {
    const now = new Date().toISOString();
    
    // Detectar estado del motor
    if (response.response.metadata?.ultraMasterEngine) {
      const metadata = response.response.metadata;
      setUltraEngineStatus(metadata.databaseStatus?.connected === false ? 'emergency' : 'active');
      setLastEngineVersion(metadata.engineVersion || 'ultra-master-v2.0');
      if (metadata.databaseStatus) {
        setDatabaseStatus(metadata.databaseStatus);
      }
    } else {
      setUltraEngineStatus('emergency');
    }

    return {
      id: Date.now() + Math.random(), // Temporal hasta que llegue del servidor
      conversationId: response.context.conversationId,
      sessionId: response.context.sessionId,
      sender: {
        type: 'bot',
        name: 'Asistente Judaica Breslov',
        avatar: '🕎'
      },
      message: {
        type: 'text',
        content: response.response.text
      },
      status: {
        isRead: false,
        isEdited: false,
        delivery: 'delivered',
        isAutomated: true
      },
      ai: {
        confidence: response.response.confidence,
        requiresHuman: response.response.requiresHuman,
        intent: response.response.intent,
        products: response.response.products || [],
        suggestions: response.response.suggestions || [],
        quality: {
          isEmergencyResponse: !response.response.metadata?.ultraMasterEngine,
          isErrorResponse: false,
          ultraMasterEngine: response.response.metadata?.ultraMasterEngine,
          engineVersion: response.response.metadata?.engineVersion
        }
      },
      timestamps: {
        created: now,
        updated: now
      }
    };
  }, []);

  // ENVÍO DE MENSAJES MEJORADO PARA ULTRA MASTER ENGINE

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !chatSession || isSending) return;

    const trimmedMessage = messageContent.trim();
    if (trimmedMessage.length > 1000) {
      setError('Mensaje muy largo (máximo 1000 caracteres)');
      return;
    }

    setIsSending(true);
    setError(null);
    setIsTyping(true);

    // Agregar mensaje del usuario inmediatamente
    const userMessage: Message = {
      id: Date.now(),
      conversationId: chatSession.conversationId,
      sessionId: chatSession.sessionId,
      sender: {
        type: 'user',
        name: 'Tú',
        avatar: '👤'
      },
      message: {
        type: 'text',
        content: trimmedMessage
      },
      status: {
        isRead: true,
        isEdited: false,
        delivery: 'sent',
        isAutomated: false
      },
      timestamps: {
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    };

    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();

    try {
      console.log('🚀 Enviando mensaje al Ultra Master Engine...');
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ultra-Master-Engine': 'true'
        },
        body: JSON.stringify({
          sessionId: chatSession.sessionId,
          conversationId: chatSession.conversationId,
          message: trimmedMessage,
          userInfo: {
            platform: 'web_widget',
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          context: {
            page: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: UltraEngineResponse = await response.json();
      console.log('🎯 Respuesta del Ultra Master Engine:', result);

      if (result.success && result.response) {
        // Procesar respuesta del Ultra Master Engine
        const botMessage = processUltraEngineResponse(result);
        
        // Actualizar mensaje del usuario con ID del servidor si está disponible
        if (result.context) {
          setMessages(prev => prev.map(msg => 
            msg.id === userMessage.id 
              ? { ...msg, status: { ...msg.status, delivery: 'delivered' } }
              : msg
          ));
        }

        // Agregar respuesta del bot con animación
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, botMessage]);
          scrollToBottom();

          // Actualizar contexto de sesión
          setChatSession(prev => prev ? {
            ...prev,
            messageCount: result.context?.messageCount ?? (prev.messageCount + 1),
            ultraMasterEngine: result.response.metadata?.ultraMasterEngine,
            databaseStatus: result.response.metadata?.databaseStatus ?? prev.databaseStatus ?? null
          } : null);

          if (result.response.metadata?.databaseStatus) {
            setDatabaseStatus(result.response.metadata.databaseStatus);
            if (result.response.metadata.databaseStatus.connected === false) {
              setUltraEngineStatus('emergency');
            }
          }

        }, Math.min(result.response.metadata?.processingTime || 1000, 2000));

      } else {
        throw new Error(result.response?.text || 'Error en Ultra Master Engine');
      }

    } catch (error) {
      console.error('❌ Error enviando al Ultra Master Engine:', error);
      setIsTyping(false);
      setUltraEngineStatus('offline');
      
      // Agregar mensaje de error especializado
      const errorMessage: Message = {
        id: Date.now() + 1,
        conversationId: chatSession.conversationId,
        sessionId: chatSession.sessionId,
        sender: {
          type: 'system',
          name: 'Sistema',
          avatar: '⚠️'
        },
        message: {
          type: 'text',
          content: `Ultra Master Engine temporalmente no disponible.\n\n📱 **WhatsApp directo:** https://wa.me/573009291156?text=${encodeURIComponent(trimmedMessage)}\n\nNuestros especialistas judaicos te atenderán personalmente.`
        },
        status: {
          isRead: false,
          isEdited: false,
          delivery: 'delivered',
          isAutomated: true
        },
        ai: {
          confidence: 0,
          requiresHuman: true,
          intent: 'system_error',
          suggestions: ['WhatsApp directo', 'Reintentar'],
          quality: {
            isEmergencyResponse: true,
            isErrorResponse: true
          }
        },
        timestamps: {
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, errorMessage]);
      setError('Error de conexión. Usa WhatsApp para atención inmediata.');
    } finally {
      setIsSending(false);
    }
  }, [chatSession, isSending, processUltraEngineResponse]);

  // INICIALIZACIÓN MEJORADA

  const initializeUltraChat = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');

    try {
      const currentPage = window.location.href;
      const referrer = document.referrer;
      const storedSession = loadSessionFromStorage();
      
      console.log('🔥 Inicializando Ultra Master Judaica Chat...');

      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ultra-Master-Engine': 'true'
        },
        body: JSON.stringify({
          landingPage: currentPage,
          currentPage,
          referrer,
          existingSessionId: storedSession?.sessionId,
          utmSource: new URLSearchParams(window.location.search).get('utm_source'),
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          platform: 'ultra_master_widget',
          version: '2.0'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        const engineInfo = result.data.engineInfo || {};
        const responseDatabaseStatus: DatabaseStatus | null = result.data.databaseStatus || engineInfo.database || null;

        if (responseDatabaseStatus) {
          setDatabaseStatus(responseDatabaseStatus);
          if (responseDatabaseStatus.connected === false) {
            setUltraEngineStatus('emergency');
          }
        }

        if (engineInfo.version) {
          setLastEngineVersion(engineInfo.version);
        }

        const session: ChatSession = {
          conversationId: result.data.conversationId,
          sessionId: result.data.sessionId,
          status: 'active',
          messageCount: result.data.messageCount || 0,
          existing: result.data.existing || false,
          ultraMasterEngine: true,
          databaseStatus: responseDatabaseStatus
        };

        setChatSession(session);
        setConnectionStatus('connected');
        if (engineInfo.health?.status === 'healthy') {
          setUltraEngineStatus('active');
        } else if (responseDatabaseStatus?.connected === false) {
          setUltraEngineStatus('emergency');
        } else {
          setUltraEngineStatus('active');
        }
        
        if (result.data.existing) {
          const storedMessages = loadMessagesFromStorage();
          if (storedMessages.length > 0) {
            setMessages(storedMessages);
          }
        } else {
          setMessages([]);
          localStorage.removeItem('judaica_ultra_chat_messages');
          
          // Mensaje de bienvenida del Ultra Master Engine
          const welcomeMessage: Message = {
            id: Date.now(),
            conversationId: session.conversationId,
            sessionId: session.sessionId,
            sender: {
              type: 'bot',
              name: 'Asistente Judaica Breslov',
              avatar: '🕎'
            },
            message: {
              type: 'text',
              content: '¡Shalom Aleichem! 🕎\n\nBienvenido a **Judaica Breslov Colombia**\n\n🔥 **Ultra Master Engine** activado\n📚 Especialistas en productos judaicos auténticos\n\n¿En qué mitzvá puedo ayudarte hoy?'
            },
            status: {
              isRead: false,
              isEdited: false,
              delivery: 'delivered',
              isAutomated: true
            },
            ai: {
              confidence: 1.0,
              requiresHuman: false,
              intent: 'welcome',
              suggestions: ['Ver libros Breslov', 'Artículos rituales', 'WhatsApp directo'],
              quality: {
                isEmergencyResponse: false,
                isErrorResponse: false,
                ultraMasterEngine: true,
                engineVersion: 'ultra-master-v2.0'
              }
            },
            timestamps: {
              created: new Date().toISOString(),
              updated: new Date().toISOString()
            }
          };

          const initialMessages: Message[] = [welcomeMessage];

          if (responseDatabaseStatus?.connected === false) {
            initialMessages.push({
              id: Date.now() + 1,
              conversationId: session.conversationId,
              sessionId: session.sessionId,
              sender: {
                type: 'system',
                name: 'Sistema',
                avatar: '⚠️'
              },
              message: {
                type: 'text',
                content: 'El motor Ultra Master está activo, pero la base de datos principal está fuera de línea temporalmente. Usaremos nuestro catálogo especializado sin conexión. 🕎'
              },
              status: {
                isRead: false,
                isEdited: false,
                delivery: 'delivered',
                isAutomated: true
              },
              ai: {
                confidence: 1,
                requiresHuman: false,
                intent: 'system_notice',
                suggestions: ['Ver catálogo', 'Continuar conversación'],
                quality: {
                  isEmergencyResponse: true,
                  isErrorResponse: false,
                  ultraMasterEngine: true,
                  engineVersion: engineInfo.version || 'ultra-master-v2.0'
                }
              },
              timestamps: {
                created: new Date().toISOString(),
                updated: new Date().toISOString()
              }
            });
          }

          setMessages(initialMessages);
        }

      } else {
        throw new Error(result.message || 'Error iniciando Ultra Master Chat');
      }
    } catch (error) {
      console.error('❌ Error inicializando Ultra Master Chat:', error);
      setError('No se pudo conectar al Ultra Master Engine.');
      setConnectionStatus('disconnected');
      setUltraEngineStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  // EFECTOS MEJORADOS

  useEffect(() => {
    if (isOpen && !chatSession) {
      const storedSession = loadSessionFromStorage();
      if (storedSession && storedSession.ultraMasterEngine) {
        console.log('🔄 Restaurando sesión Ultra Master...');
        setChatSession(storedSession);
        setDatabaseStatus(storedSession.databaseStatus || null);
        if (storedSession.databaseStatus?.connected === false) {
          setUltraEngineStatus('emergency');
        }
        const storedMessages = loadMessagesFromStorage();
        if (storedMessages.length > 0) {
          setMessages(storedMessages);
        }
      } else {
        initializeUltraChat();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatSession) {
      saveSessionToStorage(chatSession);
    }
  }, [chatSession, saveSessionToStorage]);

  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
      scrollToBottom();
    }
  }, [messages, saveMessagesToStorage]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // FUNCIONES AUXILIARES MEJORADAS

  const openChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    setIsMinimized(false);
    setError(null);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleWhatsAppClick = () => {
    if (typeof window !== 'undefined') {
      window.open('https://wa.me/573009291156?text=Hola,%20vengo%20del%20Ultra%20Master%20Chat%20de%20su%20página%20web', '_blank');
    }
  };

  // RENDERIZADO MEJORADO DE COMPONENTES

  const renderUltraAISuggestions = (message: Message) => {
    if (!message.ai?.suggestions || message.ai.suggestions.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-blue-100">
        <p className="text-xs text-blue-600 mb-2 font-medium flex items-center">
          <span className="mr-1">🤖</span> Ultra Master sugiere:
        </p>
        <div className="flex flex-wrap gap-2">
          {message.ai.suggestions.slice(0, 3).map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => {
                setNewMessage(suggestion);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-700 px-3 py-2 rounded-full transition-all duration-200 border border-blue-200 hover:border-blue-300 hover:shadow-sm font-medium"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderUltraAIProducts = (message: Message) => {
    if (!message.ai?.products || message.ai.products.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-green-100">
        <p className="text-xs text-green-600 mb-2 font-medium flex items-center">
          <span className="mr-1">🛍️</span> Productos especializados:
        </p>
        <div className="space-y-2">
          {message.ai.products.slice(0, 2).map((product, idx) => (
            <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200 hover:shadow-md transition-all duration-200">
              <p className="text-sm font-semibold text-gray-800">{product.name}</p>
              <p className="text-sm text-green-600 font-bold">
                ${new Intl.NumberFormat('es-CO').format(product.display_price || product.price)}
              </p>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => {
                    setNewMessage(`Información sobre ${product.name}`);
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                  className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors font-medium"
                >
                  Más info
                </button>
                {product.url && (
                  <button
                    onClick={() => window.open(product.url, '_blank')}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors font-medium"
                  >
                    Ver producto
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const makeLinksClickable = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s)]+)/gi;
    const whatsappRegex = /(https:\/\/wa\.me\/[^\s)]+)/gi;
    
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        const isWhatsApp = whatsappRegex.test(part);
        
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              window.open(part, '_blank');
            }}
            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md mx-1 ${
              isWhatsApp 
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <span className="mr-1.5 text-sm">{isWhatsApp ? '📱' : '🔗'}</span>
            <span>{isWhatsApp ? 'WhatsApp' : 'Ver Enlace'}</span>
          </button>
        );
      }
      return part;
    });
  };

  const renderMessageContent = (content: string) => {
    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {content.split('\n').map((line, i) => {
          const processedLine = line.replace(/\*\*([^*]+)\*\*/g, '$1');
          const finalLine = makeLinksClickable(processedLine);
          
          if (line.startsWith('**') || line.includes('🔸') || line.includes('•')) {
            return <div key={i} className="font-semibold mb-2 text-gray-800">{finalLine}</div>;
          }
          return line ? <div key={i} className="mb-1">{finalLine}</div> : <br key={i} />;
        })}
      </div>
    );
  };

  const getEngineStatusIndicator = () => {
    if (ultraEngineStatus === 'offline') {
      return { icon: '⚠️', text: 'Engine offline', color: 'text-red-500' };
    }

    if (databaseStatus?.connected === false) {
      return { icon: '⚡', text: 'Modo emergencia (catálogo offline)', color: 'text-yellow-500' };
    }

    return ultraEngineStatus === 'active'
      ? { icon: '🚀', text: 'Ultra Master Engine activo', color: 'text-green-500' }
      : { icon: '⚡', text: 'Modo emergencia', color: 'text-yellow-500' };
  };

  const statusIndicator = getEngineStatusIndicator();

  return (
    <>
      {/* Botón flotante mejorado */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={openChat}
            className="group relative bg-transparent hover:scale-110 transition-all duration-300 transform"
            title="Ultra Master Judaica Assistant - ¡Pregúntanos!"
          >
            <div className="w-16 h-16 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
              <img 
                src="/favicon.ico" 
                alt="Judaica Breslov Ultra Master" 
                className="w-12 h-12 object-contain drop-shadow-2xl filter brightness-110 z-10 relative"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl z-10 relative">🕎</span>';
                }}
              />
            </div>
            
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-bounce font-bold shadow-lg border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            
            <span className={`absolute top-2 right-2 block h-3 w-3 rounded-full ${
              ultraEngineStatus === 'active' ? 'bg-green-400' : 
              ultraEngineStatus === 'emergency' ? 'bg-yellow-400' : 'bg-red-400'
            } animate-pulse shadow-lg border border-white`}></span>
          </button>
        </div>
      )}

      {/* Ventana de chat Ultra Master */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-3xl shadow-2xl border border-gray-200 transition-all duration-500 ${
          isMinimized ? 'h-20' : 'h-[750px]'
        } w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden`}>
          
          {/* Header Ultra Master */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white p-4 rounded-t-3xl flex items-center justify-between relative overflow-hidden min-h-[90px]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
            
            <div className="flex items-center space-x-4 relative z-10">
              <div className="relative">
                <img 
                  src="/favicon.ico" 
                  alt="Ultra Master Judaica" 
                  className="w-16 h-16 object-contain drop-shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).outerHTML = '<span class="text-4xl drop-shadow-lg">🕎</span>';
                  }}
                />
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${
                  ultraEngineStatus === 'active' ? 'bg-green-400' : 
                  ultraEngineStatus === 'emergency' ? 'bg-yellow-400' : 'bg-red-400'
                } shadow-lg animate-pulse border-2 border-white`}></span>
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-wide">Judaica Breslov</h3>
                <p className="text-sm text-blue-100 flex items-center space-x-2 font-medium">
                  <span className="text-sm">{statusIndicator.icon}</span>
                  <span>Ultra Master Engine</span>
                </p>
                <p className={`text-xs ${statusIndicator.color} font-medium`}>
                  {statusIndicator.text}
                </p>
                {lastEngineVersion && (
                  <p className="text-xs text-blue-200 mt-1">
                    v{lastEngineVersion}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-2 relative z-10">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-blue-100 hover:text-white hover:bg-white/20 p-2.5 rounded-xl transition-all duration-300 hover:scale-110"
                title="Minimizar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={closeChat}
                className="text-blue-100 hover:text-white hover:bg-white/20 p-2.5 rounded-xl transition-all duration-300 hover:scale-110"
                title="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Área de mensajes Ultra Master */}
              <div className="flex-1 min-h-[450px] max-h-[500px] overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 via-white to-gray-50 scrollbar-custom">
                {isLoading && (
                  <div className="text-center text-gray-500 text-sm py-12">
                    <div className="inline-flex items-center space-x-3 bg-white rounded-2xl px-6 py-4 shadow-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="font-medium">Conectando Ultra Master Engine...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{error}</span>
                      <button 
                        onClick={() => setError(null)}
                        className="ml-3 text-red-500 hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Renderizado de mensajes Ultra Master */}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-sm px-4 py-3 rounded-3xl shadow-md transition-all duration-300 hover:shadow-lg ${
                      message.sender.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-lg'
                        : message.sender.type === 'agent'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-bl-lg'
                        : message.sender.type === 'system'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-bl-lg'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-lg'
                    }`}>
                      {/* Header del mensaje Ultra Master */}
                      {message.sender.type !== 'user' && (
                        <div className="flex items-center justify-between space-x-3 mb-3 pb-2 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{message.sender.avatar}</span>
                            <span className="text-sm font-bold text-gray-700">{message.sender.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {message.ai?.quality?.ultraMasterEngine && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">
                                Ultra
                              </span>
                            )}
                            {message.ai && message.ai.confidence > 0 && (
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                message.ai.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                                message.ai.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {(message.ai.confidence * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Contenido del mensaje */}
                      {renderMessageContent(message.message.content)}
                      
                      {/* Productos y sugerencias Ultra Master */}
                      {message.ai && renderUltraAIProducts(message)}
                      {message.ai && renderUltraAISuggestions(message)}
                      
                      {/* Footer del mensaje */}
                      <div className={`flex items-center justify-between mt-3 pt-2 text-xs border-t ${
                        message.sender.type === 'user' 
                          ? 'text-blue-100 border-blue-400/30' 
                          : 'text-gray-500 border-gray-100'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{formatTime(message.timestamps.created)}</span>
                          {message.ai && message.ai.intent && message.ai.intent !== 'unknown' && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-1 py-0.5 rounded">
                              {message.ai.intent.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {message.sender.type === 'user' && (
                          <span className="flex items-center space-x-1">
                            {message.status.delivery === 'sent' && <span className="text-blue-200">✓</span>}
                            {message.status.delivery === 'delivered' && <span className="text-blue-300">✓✓</span>}
                            {message.status.delivery === 'read' && <span className="text-green-300">✓✓</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Indicador de escritura Ultra Master */}
                {(isSending || isTyping) && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-3 rounded-3xl border border-gray-200 shadow-md">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {isSending ? 'Ultra Master procesando...' : 'Asistente escribiendo...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Botón WhatsApp mejorado */}
              <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white text-sm py-3 px-5 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <span className="text-lg">📱</span>
                  <span>Continuar por WhatsApp</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Especialistas</span>
                </button>
              </div>

              {/* Input mejorado */}
              <div className="border-t border-gray-100 p-5 bg-gradient-to-r from-white to-gray-50 rounded-b-3xl">
                <form onSubmit={handleSendMessage} className="flex space-x-3 items-end">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Pregunta sobre productos judaicos kosher..."
                      className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-500 shadow-inner bg-white"
                      disabled={isSending || isLoading}
                      maxLength={1000}
                    />
                    <div className="absolute right-4 bottom-4 text-xs text-gray-400 font-medium">
                      {newMessage.length}/1000
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl p-4 transition-all duration-300 transform hover:scale-110 disabled:transform-none shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </form>
                
                {/* Indicador de estado Ultra Master */}
                <div className="mt-2 text-center">
                    <span className={`text-xs font-medium flex items-center justify-center space-x-1 ${statusIndicator.color}`}>
                      <span>{statusIndicator.icon}</span>
                      <span>{statusIndicator.text}</span>
                    {lastEngineVersion && <span>• v{lastEngineVersion}</span>}
                    {databaseStatus?.connected === false && <span>• DB offline</span>}
                    </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Estilos CSS mejorados */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }

        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
          border-radius: 10px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #94a3b8, #64748b);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-bounce {
          animation: bounce 1.4s infinite;
        }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }

        * {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-spin,
          .animate-bounce,
          .animate-pulse,
          .animate-fade-in-up,
          .animate-bounce-slow {
            animation: none;
          }
        }
        
        @media (max-width: 480px) {
          .w-96 {
            width: calc(100vw - 1rem);
          }
          
          .bottom-6 {
            bottom: 1rem;
          }
          
          .right-6 {
            right: 0.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default UltraJudaicaChatWidget;