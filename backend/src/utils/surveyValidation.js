const { z } = require('zod');

// Question type specific config schemas
const baseConfigSchema = z.object({
  description: z.string().optional(),
});

const singleChoiceConfigSchema = baseConfigSchema.extend({
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
  })).min(1, 'At least one option is required'),
});

const multiChoiceConfigSchema = baseConfigSchema.extend({
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
  })).min(1, 'At least one option is required'),
  minSelections: z.number().min(0).optional(),
  maxSelections: z.number().min(1).optional(),
});

const ratingConfigSchema = baseConfigSchema.extend({
  max: z.number().min(1).max(10).default(5),
  icon: z.enum(['star', 'number']).default('star'),
});

const dateConfigSchema = baseConfigSchema.extend({
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
});

const numberConfigSchema = baseConfigSchema.extend({
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
});

const dropdownConfigSchema = baseConfigSchema.extend({
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
  })).min(1, 'At least one option is required'),
});

// Question validation schema
const createQuestionSchema = z.object({
  type: z.enum([
    'short_text', 'long_text', 'single_choice', 'multi_choice', 
    'rating', 'date', 'email', 'number', 'dropdown', 'yes_no'
  ]),
  label: z.string().min(1, 'Question label is required').max(500),
  is_required: z.boolean().default(false),
  config: z.record(z.any()).default({}),
}).superRefine((data, ctx) => {
  // Validate config based on question type
  try {
    switch (data.type) {
      case 'single_choice':
        singleChoiceConfigSchema.parse(data.config);
        break;
      case 'multi_choice':
        multiChoiceConfigSchema.parse(data.config);
        break;
      case 'rating':
        ratingConfigSchema.parse(data.config);
        break;
      case 'date':
        dateConfigSchema.parse(data.config);
        break;
      case 'number':
        numberConfigSchema.parse(data.config);
        break;
      case 'dropdown':
        dropdownConfigSchema.parse(data.config);
        break;
      default:
        // No additional validation needed
        break;
    }
  } catch (error) {
    error.errors.forEach(err => {
      ctx.addIssue({
        path: ['config', ...err.path],
        message: err.message,
      });
    });
  }
});

const updateQuestionSchema = createQuestionSchema.partial();

const createSurveySchema = z.object({
  title: z.string().min(1, 'Survey title is required').max(255),
  description: z.string().max(5000).optional(),
  settings: z.object({
    allowMultipleResponses: z.boolean().default(true),
    thankYouMessage: z.string().max(1000).default('Thank you for completing this survey!'),
    closeDate: z.string().datetime().optional().nullable(),
    showResponseCount: z.boolean().default(false),
  }).default({}),
});

const updateSurveySchema = createSurveySchema.partial();

const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1, 'At least one question ID is required'),
});

module.exports = {
  createQuestionSchema,
  updateQuestionSchema,
  createSurveySchema,
  updateSurveySchema,
  reorderQuestionsSchema,
};