const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'accès requis' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Token invalide ou expiré' 
      });
    }

    req.user = user;
    next();
  });
};

// Middleware de vérification des rôles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentification requise' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Permissions insuffisantes' 
      });
    }

    next();
  };
};

// Middleware de limitation de taux
const rateLimit = require('rate-limiter-flexible');

const rateLimiter = new rateLimit.RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // Nombre de requêtes
  duration: 60, // Par minute
});

const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Trop de requêtes, veuillez réessayer plus tard',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1,
    });
  }
};

// Middleware de validation des données
const validateTicketData = (req, res, next) => {
  const { title, description } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      error: 'Le titre est requis et doit être une chaîne non vide'
    });
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({
      error: 'La description est requise et doit être une chaîne non vide'
    });
  }

  if (title.length > 255) {
    return res.status(400).json({
      error: 'Le titre ne peut pas dépasser 255 caractères'
    });
  }

  if (description.length > 5000) {
    return res.status(400).json({
      error: 'La description ne peut pas dépasser 5000 caractères'
    });
  }

  // Nettoyer les données
  req.body.title = title.trim();
  req.body.description = description.trim();

  next();
};

// Middleware de logging
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Middleware de gestion d'erreurs async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  authenticateToken,
  requireRole,
  rateLimitMiddleware,
  validateTicketData,
  logRequest,
  asyncHandler
};

