// lib/redis-mock.js
console.log('📦 Redis Mock cargado');

const mockRedis = {
  get: async (key) => {
    console.log(`[REDIS MOCK] GET ${key} -> null`);
    return null;
  },
  set: async (key, value) => {
    console.log(`[REDIS MOCK] SET ${key}`);
    return 'OK';
  },
  setex: async (key, ttl, value) => {
    console.log(`[REDIS MOCK] SETEX ${key} TTL:${ttl}`);
    return 'OK';
  },
  del: async (key) => {
    console.log(`[REDIS MOCK] DEL ${key}`);
    return 1;
  },
  exists: async (key) => {
    console.log(`[REDIS MOCK] EXISTS ${key} -> 0`);
    return 0;
  },
  keys: async (pattern) => {
    console.log(`[REDIS MOCK] KEYS ${pattern} -> []`);
    return [];
  },
  ping: async () => {
    console.log('[REDIS MOCK] PING -> PONG');
    return 'PONG';
  },
  ttl: async (key) => -1,
  status: 'ready',
  isOpen: true
};

export default mockRedis;