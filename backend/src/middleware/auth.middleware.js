const { verifyAccessToken } = require('../utils/jwt');
const db = require('../models/db');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
    
    // Get user
    const user = await db('users').where({ id: decoded.userId }).first();
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireVerified(req, res, next) {
  if (!req.user.verified_at) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before accessing this resource',
      },
    });
  }
  next();
}

module.exports = {
  authenticate,
  requireVerified,
};