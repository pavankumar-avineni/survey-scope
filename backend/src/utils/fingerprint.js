const crypto = require('crypto');

/**
 * Generate a deterministic fingerprint from request data
 * Used for preventing duplicate responses per session
 */
function generateFingerprint(req, surveyId) {
  const components = [
    surveyId,
    req.ip || 'unknown',
    req.headers['user-agent'] || 'unknown',
    // Add more fingerprinting data as needed (but avoid PII)
  ];
  
  const fingerprintString = components.join('|');
  
  return crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');
}

/**
 * Hash IP address for storage (GDPR compliant)
 */
function hashIP(ip) {
  if (!ip) return null;
  
  return crypto
    .createHash('sha256')
    .update(ip)
    .digest('hex');
}

module.exports = {
  generateFingerprint,
  hashIP,
};