const crypto = require('crypto');
const db = require('../models/db');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

class AuthService {
  async register(userData) {
    const { name, email, password } = userData;
    
    // Check if user exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const [user] = await db('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
      })
      .returning(['id', 'email', 'name', 'verified_at', 'created_at']);
    
    // Generate email verification token (simplified for now)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // TODO: Send verification email with this token
    console.log(`Verification token for ${email}: ${verificationToken}`);
    
    return user;
  }
  
  async login(email, password, ipAddress, userAgent) {
    // Find user
    const user = await db('users').where({ email }).first();
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }
    
    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshTokenRaw = generateRefreshToken(user.id);
    
    // Hash refresh token for storage
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenRaw)
      .digest('hex');
    
    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await db('refresh_tokens').insert({
      user_id: user.id,
      token_hash: refreshTokenHash,
      expires_at: expiresAt,
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: !!user.verified_at,
      },
      accessToken,
      refreshToken: refreshTokenRaw,
    };
  }
  
  async refresh(refreshTokenRaw) {
    // Verify token signature
    const decoded = verifyRefreshToken(refreshTokenRaw);
    if (!decoded) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
    
    // Hash token for lookup
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenRaw)
      .digest('hex');
    
    // Find token in database
    const storedToken = await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .whereNull('revoked_at')
      .where('expires_at', '>', new Date())
      .first();
    
    if (!storedToken) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken(decoded.userId);
    
    return { accessToken: newAccessToken };
  }
  
  async logout(refreshTokenRaw) {
    if (!refreshTokenRaw) {
      return;
    }
    
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenRaw)
      .digest('hex');
    
    await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .update({ revoked_at: new Date() });
  }
  
  async verifyEmail(token) {
    // Simplified - in production, store verification tokens in DB
    // For now, just mark as verified if token is valid
    console.log(`Verifying email with token: ${token}`);
    // This is a placeholder - implement full verification later
  }
}

module.exports = new AuthService();