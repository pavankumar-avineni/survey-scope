const rateLimit = require('express-rate-limit');

const publicSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 submissions per IP per hour
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many submissions from this IP, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address as the rate limit key
    return req.ip;
  },
});

module.exports = {
  publicSubmissionLimiter,
};