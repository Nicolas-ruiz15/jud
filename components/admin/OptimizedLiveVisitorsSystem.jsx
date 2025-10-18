import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, MessageCircle, Eye, MapPin, Clock, Monitor, Smartphone, Tablet,
  Globe, Chrome, TrendingUp, TrendingDown, Activity, Zap, Target,
  ShoppingCart, Search, Filter, Grid, List, Phone, Video, Mail, Star,
  AlertCircle, CheckCircle, XCircle, RefreshCw, Bell, Settings, Download,
  BarChart3, PieChart, Send, Paperclip, Smile, Plus, X, ChevronDown,
  MoreVertical, Edit, Archive, Flag, Award, ThumbsUp, ThumbsDown,
  Calendar, Timer, DollarSign, Bookmark, Tag, Hash, Info, Shield, 
  Key, Database, Cpu, Wifi, MousePointer, Layers, GitBranch, 
  PlayCircle, PauseCircle, StopCircle, FastForward, Rewind, Volume2, 
  VolumeX, Maximize2, Minimize2, Copy, ExternalLink, Share2, Save, 
  FileText, Image, Mic, Camera, Headphones, Speaker, Bluetooth, Usb, 
  HardDrive, Server, Cloud, Lock, Unlock, UserPlus, UserMinus, 
  UserCheck, UserX, Building, Navigation, Compass, Route, Car, Plane,
  Train, Bus, Home
} from 'lucide-react';

const AdvancedCRMSystem = () => {
  // Estados principales
  const [visitors, setVisitors] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Estados de UI avanzados
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('lastActivity');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados de configuración avanzados
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3);
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAutomations, setShowAutomations] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Estados de chat avanzado
  const [isTyping, setIsTyping] = useState(false);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [chatTemplates, setChatTemplates] = useState([]);
  const [emojiPicker, setEmojiPicker] = useState(false);
  const [fileUpload, setFileUpload] = useState(false);
  
  // Estados de CRM avanzado
  const [leadScoring, setLeadScoring] = useState({});
  const [customerJourney, setCustomerJourney] = useState([]);
  const [heatmaps, setHeatmaps] = useState([]);
  const [funnelAnalytics, setFunnelAnalytics] = useState([]);
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);
  const [behaviorTriggers, setBehaviorTriggers] = useState([]);
  
  // Filtros avanzados
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    location: 'all',
    device: 'all',
    engagement: 'all',
    intent: 'all',
    leadScore: 'all',
    customerValue: 'all',
    timeOnSite: 'all',
    pageViews: 'all',
    trafficSource: 'all',
    hasChat: 'all',
    hasCart: 'all',
    isReturning: 'all',
    conversionProbability: 'all'
  });

  // Estadísticas avanzadas
  const [advancedStats, setAdvancedStats] = useState({
    activeVisitors: 0,
    registeredVisitors: 0,
    anonymousVisitors: 0,
    totalPageViews: 0,
    averageSessionDuration: 0,
    newVisitorsToday: 0,
    visitorsWithCart: 0,
    averageCartValue: 0,
    visitorsWithActiveChat: 0,
    totalUnreadMessages: 0,
    conversionRate: 0,
    bounceRate: 0,
    averageLeadScore: 0,
    hotLeads: 0,
    qualifiedLeads: 0,
    totalRevenue: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
    chatsSolved: 0,
    activeAutomations: 0
  });

  // Referencias
  const intervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const retryCountRef = useRef(0);
  const audioRef = useRef(null);
  const notificationRef = useRef(null);

  // WebSocket para tiempo real
  const [wsConnection, setWsConnection] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');

  // Configuración de automatizaciones tipo SalesIQ
  const defaultAutomations = [
    {
      id: 1,
      name: 'Saludo Automático',
      trigger: 'page_visit',
      condition: 'time_on_page > 30',
      action: 'send_message',
      message: '¡Hola! ¿Te puedo ayudar en algo?',
      active: true,
      priority: 'high'
    },
    {
      id: 2,
      name: 'Abandono de Carrito',
      trigger: 'cart_abandonment',
      condition: 'cart_value > 50',
      action: 'send_notification',
      message: '¿Necesitas ayuda con tu compra?',
      active: true,
      priority: 'urgent'
    },
    {
      id: 3,
      name: 'Lead Caliente',
      trigger: 'high_engagement',
      condition: 'lead_score > 80',
      action: 'assign_agent',
      message: 'Lead de alta prioridad detectado',
      active: true,
      priority: 'urgent'
    },
    {
      id: 4,
      name: 'Visitante Recurrente',
      trigger: 'returning_visitor',
      condition: 'visits > 3',
      action: 'show_offer',
      message: '¡Bienvenido de vuelta! Tenemos una oferta especial',
      active: true,
      priority: 'medium'
    }
  ];

  // Respuestas rápidas predefinidas
  const defaultQuickReplies = [
    { id: 1, text: '¡Hola! ¿En qué puedo ayudarte?', category: 'saludo' },
    { id: 2, text: '¿Te interesa conocer nuestros productos?', category: 'productos' },
    { id: 3, text: '¿Tienes alguna pregunta específica?', category: 'pregunta' },
    { id: 4, text: 'Te puedo ofrecer un descuento especial', category: 'oferta' },
    { id: 5, text: '¿Necesitas ayuda técnica?', category: 'soporte' },
    { id: 6, text: 'Permíteme transferirte con un especialista', category: 'transfer' },
    { id: 7, text: 'Gracias por tu tiempo. ¡Que tengas un buen día!', category: 'despedida' }
  ];

  // Función para inicializar WebSocket
  const initializeWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(`ws://localhost:3001/admin-chat`);
      
      ws.onopen = () => {
        setWsStatus('connected');
        setWsConnection(ws);
        console.log('WebSocket conectado');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.onclose = () => {
        setWsStatus('disconnected');
        setWsConnection(null);
        // Reconectar después de 5 segundos
        setTimeout(initializeWebSocket, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsStatus('error');
      };
      
    } catch (error) {
      console.error('Error inicializando WebSocket:', error);
      setWsStatus('error');
    }
  }, []);

  // Manejar mensajes del WebSocket
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'new_visitor':
        setVisitors(prev => [data.visitor, ...prev]);
        playNotificationSound();
        showRealTimeAlert('Nuevo visitante conectado', 'info');
        break;
        
      case 'visitor_update':
        setVisitors(prev => prev.map(v => 
          v.id === data.visitor.id ? { ...v, ...data.visitor } : v
        ));
        break;
        
      case 'new_message':
        setMessages(prev => [...prev, data.message]);
        playNotificationSound();
        showRealTimeAlert('Nuevo mensaje recibido', 'message');
        break;
        
      case 'chat_started':
        setConversations(prev => [data.conversation, ...prev]);
        playNotificationSound();
        showRealTimeAlert('Nueva conversación iniciada', 'chat');
        break;
        
      case 'automation_triggered':
        showRealTimeAlert(`Automatización: ${data.automation.name}`, 'automation');
        break;
        
      case 'lead_scored':
        updateLeadScore(data.visitorId, data.score);
        if (data.score > 80) {
          showRealTimeAlert('Lead caliente detectado!', 'urgent');
        }
        break;
        
      default:
        console.log('Mensaje WebSocket no manejado:', data);
    }
  };

  // Función para reproducir sonidos de notificación
  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Error reproduciendo sonido:', e));
    }
  };

  // Mostrar alertas en tiempo real
  const showRealTimeAlert = (message, type) => {
    const alert = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setRealTimeAlerts(prev => [alert, ...prev.slice(0, 4)]);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      setRealTimeAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 5000);
  };

  // Función mejorada para obtener datos
  const fetchAdvancedData = useCallback(async (includeHistory = false) => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      
      const startTime = Date.now();
      
      const endpoints = [
        '/api/admin/analytics/live-visitors-optimized?includeHistory=' + includeHistory,
        '/api/admin/chat/conversations?status=active',
        '/api/admin/crm/leads?status=active',
        '/api/admin/analytics/realtime-stats',
        '/api/admin/crm/lead-scoring',
        '/api/admin/analytics/heatmaps',
        '/api/admin/automations/active'
      ];
      
      const responses = await Promise.allSettled(
        endpoints.map(endpoint =>
          fetch(endpoint, {
            credentials: 'include',
            headers: { 
              'Cache-Control': 'no-cache',
              'X-Requested-With': 'XMLHttpRequest'
            }
          })
        )
      );

      const responseTime = Date.now() - startTime;
      console.log(`Advanced data fetch completed in ${responseTime}ms`);

      // Procesar respuestas
      const [visitorsRes, conversationsRes, leadsRes, statsRes, scoringRes, heatmapsRes, automationsRes] = responses;

      // Visitantes
      if (visitorsRes.status === 'fulfilled' && visitorsRes.value.ok) {
        const visitorsData = await visitorsRes.value.json();
        if (visitorsData.success) {
          setVisitors(visitorsData.data.visitors);
          setAdvancedStats(prev => ({ ...prev, ...visitorsData.data.stats }));
        }
      }

      // Conversaciones 
      if (conversationsRes.status === 'fulfilled' && conversationsRes.value.ok) {
        const conversationsData = await conversationsRes.value.json();
        if (conversationsData.success) {
          setConversations(conversationsData.data.conversations);
        }
      }

      // Leads (simulado si no existe la API)
      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
        const leadsData = await leadsRes.value.json();
        if (leadsData.success) {
          setLeads(leadsData.data.leads);
        }
      } else {
        // Generar leads basados en visitantes
        const generatedLeads = visitors
          .filter(v => v.behavior.leadScore > 60)
          .map(v => ({
            id: v.id,
            name: v.user.name,
            email: v.user.email,
            score: v.behavior.leadScore,
            status: v.behavior.leadScore > 80 ? 'hot' : 'warm',
            source: v.traffic.source,
            value: v.behavior.cartValue || 0,
            lastActivity: v.session.lastActivity,
            conversationId: v.chat.conversationId
          }));
        setLeads(generatedLeads);
      }

      setConnectionStatus('connected');
      retryCountRef.current = 0;
      lastUpdateRef.current = Date.now();

    } catch (error) {
      console.error('Error fetching advanced data:', error);
      retryCountRef.current++;
      
      if (retryCountRef.current < 3) {
        setConnectionStatus('reconnecting');
        setTimeout(() => fetchAdvancedData(includeHistory), 2000 * retryCountRef.current);
      } else {
        setConnectionStatus('error');
        setError(`Error de conexión: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [visitors]);

  // Función para iniciar chat avanzado
  const handleAdvancedStartChat = async (visitor) => {
    try {
      const response = await fetch('/api/admin/chat/start-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: visitor.sessionId,
          visitorId: visitor.visitorId,
          visitorName: visitor.user.name,
          visitorEmail: visitor.user.email,
          leadScore: visitor.behavior.leadScore,
          pageContext: visitor.session.currentPage,
          deviceInfo: visitor.device,
          locationInfo: visitor.location
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSelectedConversation({
          id: result.data.conversationId,
          visitor: visitor.user,
          sessionId: visitor.sessionId,
          leadScore: visitor.behavior.leadScore,
          context: {
            currentPage: visitor.session.currentPage,
            timeOnSite: visitor.session.duration,
            pageViews: visitor.session.pageViews,
            intent: visitor.behavior.intent
          }
        });
        setActiveView('chat');
        fetchConversationMessages(result.data.conversationId);
        
        // Enviar al WebSocket
        if (wsConnection) {
          wsConnection.send(JSON.stringify({
            type: 'chat_started',
            conversationId: result.data.conversationId,
            visitorId: visitor.visitorId
          }));
        }
      }
    } catch (error) {
      console.error('Error iniciando chat avanzado:', error);
      setError('Error iniciando chat avanzado');
    }
  };

  // Función para enviar mensaje avanzado
  const handleAdvancedSendMessage = async () => {
    if (!newMessage.trim() || isSending || !selectedConversation) return;

    const messageText = newMessage.trim();
    setIsSending(true);
    setNewMessage('');

    try {
      const response = await fetch('/api/admin/chat/respond-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          message: messageText,
          assignToMe: true,
          context: selectedConversation.context,
          messageType: 'text',
          priority: selectedConversation.leadScore > 80 ? 'high' : 'normal'
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Actualizar inmediatamente en UI
        const newMsg = {
          id: result.data.messageId,
          conversationId: selectedConversation.id,
          content: messageText,
          sender: { type: 'agent', name: 'Admin' },
          timestamp: new Date(),
          read: false
        };
        setMessages(prev => [...prev, newMsg]);
        
        // Enviar al WebSocket
        if (wsConnection) {
          wsConnection.send(JSON.stringify({
            type: 'message_sent',
            message: newMsg,
            conversationId: selectedConversation.id
          }));
        }
      }
    } catch (error) {
      console.error('Error enviando mensaje avanzado:', error);
      setNewMessage(messageText);
      setError('Error enviando mensaje');
    } finally {
      setIsSending(false);
    }
  };

  // Función para manejar automatizaciones
  const triggerAutomation = async (automationId, visitorId, context = {}) => {
    try {
      const response = await fetch('/api/admin/automations/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          automationId,
          visitorId,
          context
        }),
      });

      const result = await response.json();
      if (result.success) {
        showRealTimeAlert(`Automatización ejecutada: ${result.data.automationName}`, 'automation');
      }
    } catch (error) {
      console.error('Error ejecutando automatización:', error);
    }
  };

  // Función para actualizar lead score
  const updateLeadScore = (visitorId, newScore) => {
    setVisitors(prev => prev.map(v => 
      v.visitorId === visitorId 
        ? { ...v, behavior: { ...v.behavior, leadScore: newScore } }
        : v
    ));
    
    setLeadScoring(prev => ({
      ...prev,
      [visitorId]: {
        score: newScore,
        lastUpdated: new Date(),
        factors: {
          engagement: Math.min(newScore * 0.4, 40),
          intent: Math.min(newScore * 0.3, 30),
          behavior: Math.min(newScore * 0.3, 30)
        }
      }
    }));
  };

  // Función para obtener mensajes de conversación
  const fetchConversationMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}&includeContext=true`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedMessages = data.data.messages.map(msg => ({
            id: msg.id,
            conversationId: msg.conversationId,
            content: msg.message.content,
            sender: {
              type: msg.sender.type,
              name: msg.sender.name,
              avatar: msg.sender.name?.charAt(0).toUpperCase() || 'U'
            },
            timestamp: new Date(msg.timestamps.created),
            read: msg.status.isRead
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
    }
  };

  // Inicialización
  useEffect(() => {
    setIsLoading(true);
    fetchAdvancedData(true);
    initializeWebSocket();
    
    // Configurar automatizaciones por defecto
    setAutomations(defaultAutomations);
    setQuickReplies(defaultQuickReplies);
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [fetchAdvancedData, initializeWebSocket]);

  // Auto-refresh mejorado
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchAdvancedData(false);
      }, refreshInterval * 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, refreshInterval, fetchAdvancedData]);

  // Funciones de utilidad
  const getCountryFlag = (countryCode) => {
    const flags = {
      'ES': '🇪🇸', 'MX': '🇲🇽', 'CO': '🇨🇴', 'AR': '🇦🇷', 'CL': '🇨🇱',
      'PE': '🇵🇪', 'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'FR': '🇫🇷',
      'DE': '🇩🇪', 'IT': '🇮🇹', 'BR': '🇧🇷', 'AU': '🇦🇺', 'IL': '🇮🇱'
    };
    return flags[countryCode] || '🌍';
  };

  const getLeadScoreColor = (score) => {
    if (score >= 90) return 'text-red-700 bg-red-100 border-red-300';
    if (score >= 80) return 'text-orange-700 bg-orange-100 border-orange-300';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    if (score >= 40) return 'text-blue-700 bg-blue-100 border-blue-300';
    return 'text-gray-700 bg-gray-100 border-gray-300';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Componente de tarjeta de visitante avanzada
  const AdvancedVisitorCard = ({ visitor, isSelected, onClick }) => (
    <div
      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg relative ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Indicador de lead score */}
      <div className={`absolute -top-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold ${
        visitor.behavior.leadScore >= 90 ? 'bg-red-500' :
        visitor.behavior.leadScore >= 80 ? 'bg-orange-500' :
        visitor.behavior.leadScore >= 60 ? 'bg-yellow-500' :
        visitor.behavior.leadScore >= 40 ? 'bg-blue-500' : 'bg-gray-500'
      }`}>
        {visitor.behavior.leadScore}
      </div>
      
      {/* Indicador de automatización activa */}
      {visitor.hasActiveAutomation && (
        <div className="absolute top-2 left-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
              visitor.isVIP ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              {visitor.user.avatar}
            </div>
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              visitor.session.status === 'online' ? 'bg-green-500' :
              visitor.session.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
            }`}></div>
            {visitor.isVIP && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-yellow-800" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-gray-900 text-lg">{visitor.user.name}</h3>
              <span className="text-xl">{getCountryFlag(visitor.location.countryCode)}</span>
              {visitor.behavior.intent === 'purchase' && <ShoppingCart className="w-4 h-4 text-green-600" />}
              {visitor.chat.hasActiveChat && <MessageCircle className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-sm text-gray-600 mb-2">{visitor.location.city}</p>
            
            <div className="flex items-center space-x-3 text-xs text-gray-500 mb-3">
              <div className="flex items-center space-x-1">
                <Monitor className="w-3 h-3" />
                <span>{visitor.device.type}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(visitor.session.lastActivity)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{visitor.session.pageViews}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Información avanzada del comportamiento */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
            visitor.behavior.intent === 'purchase' ? 'bg-green-100 text-green-700 border-green-300' :
            visitor.behavior.intent === 'support' ? 'bg-blue-100 text-blue-700 border-blue-300' :
            visitor.behavior.intent === 'research' ? 'bg-purple-100 text-purple-700 border-purple-300' :
            'bg-gray-100 text-gray-700 border-gray-300'
          }`}>
            {visitor.behavior.intent}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLeadScoreColor(visitor.behavior.leadScore)}`}>
            Lead: {visitor.behavior.leadScore}%
          </span>
        </div>
        
        {/* Página actual con más detalle */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Página actual:</span>
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">{Math.floor(visitor.session.timeOnCurrentPage / 60)}m</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">
            {visitor.session.currentPageTitle || visitor.session.currentPage}
          </p>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Scroll: {visitor.session.scrollDepth}%</span>
            <span>Clics: {visitor.session.clickCount}</span>
            <span>Duración: {Math.floor(visitor.session.duration / 60)}m</span>
          </div>
        </div>

        {/* Carrito si existe */}
        {visitor.behavior.cartValue > 0 && (
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                {visitor.behavior.cartItems} artículos
              </span>
            </div>
            <span className="font-bold text-orange-900">
              {formatCurrency(visitor.behavior.cartValue)}
            </span>
          </div>
        )}

        {/* Alertas inteligentes */}
        {visitor.behavior.leadScore > 80 && (
          <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <Flag className="w-4 h-4 text-red-600" />
            <span className="text-xs text-red-700 font-medium">Lead caliente - Contactar ahora</span>
          </div>
        )}
        
        {visitor.session.status === 'online' && visitor.session.timeOnCurrentPage > 120 && (
          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <Bell className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Visitante navegando activamente</span>
          </div>
        )}
      </div>
      
      {/* Botones de acción mejorados */}
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleAdvancedStartChat(visitor);
          }}
          className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat</span>
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick(visitor);
          }}
          className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>Ver</span>
        </button>
      </div>
    </div>
  );

  // Panel de automatizaciones
  const AutomationsPanel = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Automatizaciones Activas</h3>
        <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Nueva Automatización
        </button>
      </div>
      
      <div className="space-y-4">
        {automations.map((automation) => (
          <div key={automation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${automation.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div>
                <h4 className="font-medium text-gray-900">{automation.name}</h4>
                <p className="text-sm text-gray-600">{automation.condition}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                automation.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                automation.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {automation.priority}
              </span>
              <button 
                onClick={() => setAutomations(prev => 
                  prev.map(a => a.id === automation.id ? {...a, active: !a.active} : a)
                )}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {automation.active ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Panel de leads
  const LeadsPanel = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Leads Activos</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Score promedio: {Math.round(advancedStats.averageLeadScore)}%</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {leads.slice(0, 5).map((lead) => (
          <div key={lead.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                lead.score >= 90 ? 'bg-red-500' :
                lead.score >= 80 ? 'bg-orange-500' :
                lead.score >= 60 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                {lead.score}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{lead.name}</h4>
                <p className="text-sm text-gray-600">{lead.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lead.status === 'hot' ? 'bg-red-100 text-red-700' :
                    lead.status === 'warm' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {lead.status}
                  </span>
                  <span className="text-xs text-gray-500">{lead.source}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(lead.value)}
              </div>
              <div className="text-xs text-gray-500">
                {formatTimeAgo(lead.lastActivity)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Alertas en tiempo real
  const RealTimeAlerts = () => (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {realTimeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 max-w-sm transition-all duration-300 ${
            alert.type === 'urgent' ? 'bg-red-50 border-red-500' :
            alert.type === 'chat' ? 'bg-blue-50 border-blue-500' :
            alert.type === 'automation' ? 'bg-purple-50 border-purple-500' :
            'bg-green-50 border-green-500'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alert.type === 'urgent' && <Flag className="w-5 h-5 text-red-600" />}
            {alert.type === 'chat' && <MessageCircle className="w-5 h-5 text-blue-600" />}
            {alert.type === 'automation' && <Zap className="w-5 h-5 text-purple-600" />}
            {alert.type === 'info' && <Info className="w-5 h-5 text-green-600" />}
            <span className="text-sm font-medium">{alert.message}</span>
            <button
              onClick={() => setRealTimeAlerts(prev => prev.filter(a => a.id !== alert.id))}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Audio para notificaciones */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.wav" type="audio/wav" />
      </audio>

      {/* Alertas en tiempo real */}
      <RealTimeAlerts />

      {/* Header avanzado */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <h1 className="text-xl font-bold text-gray-900">CRM Avanzado - Tiempo Real</h1>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <span>{connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}</span>
                  {wsStatus === 'connected' && <Wifi className="w-4 h-4 text-green-500" />}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar visitantes, leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-48"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
              </button>

              <button
                onClick={() => setShowAutomations(!showAutomations)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showAutomations ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Auto</span>
              </button>
              
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'text-green-600 hover:bg-green-100' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              
              <button
                onClick={fetchAdvancedData}
                disabled={isLoading}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation mejorada */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeView === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveView('visitors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeView === 'visitors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Visitantes ({visitors.length})</span>
            </button>

            <button
              onClick={() => setActiveView('leads')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeView === 'leads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Leads ({leads.length})</span>
              {leads.filter(l => l.score > 80).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {leads.filter(l => l.score > 80).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeView === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            {selectedConversation && (
              <button
                onClick={() => setActiveView('chat')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeView === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat con {selectedConversation.visitor.name}</span>
                {selectedConversation.leadScore > 80 && (
                  <Flag className="w-4 h-4 text-red-500" />
                )}
              </button>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Panel de automatizaciones */}
        {showAutomations && (
          <div className="mb-6">
            <AutomationsPanel />
          </div>
        )}

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{advancedStats.activeVisitors}</div>
                    <div className="text-sm text-gray-500">Visitantes activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <Target className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-600">{leads.filter(l => l.score > 80).length}</div>
                    <div className="text-sm text-gray-500">Leads calientes</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{conversations.length}</div>
                    <div className="text-sm text-gray-500">Chats activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600">{automations.filter(a => a.active).length}</div>
                    <div className="text-sm text-gray-500">Automatizaciones</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panels principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeadsPanel />
              <AutomationsPanel />
            </div>
          </div>
        )}

        {/* Visitors View */}
        {activeView === 'visitors' && (
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {visitors.map((visitor) => (
                <AdvancedVisitorCard
                  key={visitor.id}
                  visitor={visitor}
                  isSelected={selectedVisitor?.id === visitor.id}
                  onClick={setSelectedVisitor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Leads View */}
        {activeView === 'leads' && (
          <div className="space-y-6">
            <LeadsPanel />
          </div>
        )}

        {/* Chat View Avanzado */}
        {activeView === 'chat' && selectedConversation && (
          <div className="bg-white rounded-2xl border border-gray-200 flex flex-col shadow-sm" style={{height: '700px'}}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chat con {selectedConversation.visitor.name}
                  </h3>
                  {selectedConversation.leadScore > 80 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">
                      Lead Caliente ({selectedConversation.leadScore}%)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    setActiveView('visitors');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Contexto del visitante */}
              {selectedConversation.context && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-blue-600 font-medium">Página actual</div>
                    <div className="text-blue-800">{selectedConversation.context.currentPage}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-green-600 font-medium">Tiempo en sitio</div>
                    <div className="text-green-800">{Math.floor(selectedConversation.context.timeOnSite / 60)}m</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-orange-600 font-medium">Intención</div>
                    <div className="text-orange-800">{selectedConversation.context.intent}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.filter(m => m.conversationId === selectedConversation.id).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.type === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-sm px-4 py-3 rounded-2xl ${
                    message.sender.type === 'agent'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                  }`}>
                    {message.sender.type !== 'agent' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                          {message.sender.avatar}
                        </div>
                        <span className="text-sm font-medium">{message.sender.name}</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.sender.type === 'agent' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTimeAgo(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-white">
              <div className="flex space-x-3 mb-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAdvancedSendMessage();
                      }
                    }}
                    placeholder="Escribe tu respuesta..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    disabled={isSending}
                  />
                </div>
                <button
                  onClick={handleAdvancedSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>Enviar</span>
                </button>
              </div>
              
              {/* Respuestas rápidas mejoradas */}
              <div className="flex flex-wrap gap-2">
                {quickReplies.slice(0, 4).map((reply) => (
                  <button 
                    key={reply.id}
                    onClick={() => setNewMessage(reply.text)}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control de auto-refresh mejorado */}
      <div className="fixed bottom-6 right-6 z-20">
        <div className="bg-white rounded-full shadow-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3">
              <span className="text-xs text-gray-600">Actualización:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
              </select>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-full transition-colors ${
                autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {autoRefresh ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCRMSystem;