// lib/redis.js - CREAR ESTE ARCHIVO

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: 0,
  retryDelayOnFailover: 100,
  retryOnFailover: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redis;