function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  // Known error types
  const errors = {
    EMAIL_ALREADY_EXISTS: { status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'Email already registered' },
    INVALID_CREDENTIALS: { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    INVALID_REFRESH_TOKEN: { status: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' },
    WORKSPACE_NOT_FOUND: { status: 404, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
    ACCESS_DENIED: { status: 403, code: 'ACCESS_DENIED', message: 'You do not have access to this resource' },
    INSUFFICIENT_PERMISSIONS: { status: 403, code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions' },
    SLUG_ALREADY_EXISTS: { status: 409, code: 'SLUG_ALREADY_EXISTS', message: 'Slug already exists' },
    USER_NOT_FOUND: { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' },
    ALREADY_MEMBER: { status: 409, code: 'ALREADY_MEMBER', message: 'User is already a member' },
    CANNOT_REMOVE_LAST_OWNER: { status: 400, code: 'CANNOT_REMOVE_LAST_OWNER', message: 'Cannot remove the last owner of the workspace' },
  };
  
  const error = errors[err.message];
  
  if (error) {
    return res.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }
  
  // Validation errors from Zod
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }
  
  // Default error
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Something went wrong',
    },
  });
}

module.exports = errorHandler;