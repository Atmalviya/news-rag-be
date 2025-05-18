const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');

const redisClient = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  }
})();


async function createSession() {
  try {
    const sessionId = uuidv4();
    await redisClient.set(`session:${sessionId}:history`, JSON.stringify([]));
    await redisClient.set(`session:${sessionId}:createdAt`, Date.now());
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}


async function getSession(sessionId) {
  try {
    const history = await getSessionHistory(sessionId);
    const createdAt = await redisClient.get(`session:${sessionId}:createdAt`);
    return history ? { history, createdAt: parseInt(createdAt) } : null;
  } catch (error) {
    console.error('Error getting session:', error);
    throw new Error('Failed to get session');
  }
}


async function addMessageToHistory(sessionId, message) {
  try {
    const history = await getSessionHistory(sessionId);
    history.push({
      ...message,
      timestamp: Date.now()
    });
    await redisClient.set(`session:${sessionId}:history`, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Error adding message to history:', error);
    throw new Error('Failed to add message to history');
  }
}


async function getSessionHistory(sessionId) {
  try {
    const history = await redisClient.get(`session:${sessionId}:history`);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting session history:', error);
    throw new Error('Failed to get session history');
  }
}


async function isValidSession(sessionId) {
  try {
    const [historyExists, createdAtExists] = await Promise.all([
      redisClient.exists(`session:${sessionId}:history`),
      redisClient.exists(`session:${sessionId}:createdAt`)
    ]);
    return historyExists === 1 && createdAtExists === 1;
  } catch (error) {
    console.error('Error validating session:', error);
    throw new Error('Failed to validate session');
  }
}


async function cleanupOldSessions(maxAgeMinutes = 60) {
  try {
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    let cleanedCount = 0;
    
    const keys = await redisClient.keys('session:*:createdAt');
    for (const key of keys) {
      const createdAt = parseInt(await redisClient.get(key));
      if (now - createdAt > maxAgeMs) {
        const sessionId = key.split(':')[1];
        await redisClient.del(`session:${sessionId}:history`);
        await redisClient.del(`session:${sessionId}:createdAt`);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    throw new Error('Failed to clean up sessions');
  }
}


async function clearSessionHistory(sessionId) {
  try {
    await redisClient.set(`session:${sessionId}:history`, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error clearing session history:', error);
    throw new Error('Failed to clear session history');
  }
}

module.exports = {
  createSession,
  getSession,
  addMessageToHistory,
  getSessionHistory,
  isValidSession,
  cleanupOldSessions,
  clearSessionHistory
};