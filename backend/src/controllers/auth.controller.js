const authService = require('../services/auth.service');
const { validate, registerSchema, loginSchema } = require('../utils/validation');

class AuthController {
  async register(req, res, next) {
    try {
      const validation = validate(registerSchema, req.body);
      if (!validation.success) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validation.errors,
          },
        });
      }
      
      const user = await authService.register(validation.data);
      
      res.status(201).json({
        success: true,
        data: {
          user,
          message: 'Registration successful. Please verify your email.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  async login(req, res, next) {
    try {
      const validation = validate(loginSchema, req.body);
      if (!validation.success) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validation.errors,
          },
        });
      }
      
      const { email, password } = validation.data;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');
      
      const result = await authService.login(email, password, ipAddress, userAgent);
      
      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'No refresh token provided',
          },
        });
      }
      
      const result = await authService.refresh(refreshToken);
      
      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      await authService.logout(refreshToken);
      
      res.clearCookie('refreshToken');
      res.json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Verification token is required',
          },
        });
      }
      
      await authService.verifyEmail(token);
      
      res.json({
        success: true,
        data: {
          message: 'Email verified successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();