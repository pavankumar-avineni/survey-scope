const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'viewer']).default('viewer'),
});

function validate(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated, errors: null };
  } catch (error) {
    const errors = error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return { success: false, data: null, errors };
  }
}

module.exports = {
  registerSchema,
  loginSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteUserSchema,
  validate,
};