const { z } = require('zod');

// Question type specific validation schemas
const validateShortText = (value, config) => {
  if (value && value.length > 500) {
    throw new Error('Text must be at most 500 characters');
  }
  return value || '';
};

const validateLongText = (value, config) => {
  if (value && value.length > 5000) {
    throw new Error('Text must be at most 5000 characters');
  }
  return value || '';
};

const validateSingleChoice = (value, config) => {
  const options = config.options || [];
  const validValues = options.map(opt => opt.value);
  
  if (!validValues.includes(value)) {
    throw new Error('Invalid option selected');
  }
  
  return value;
};

const validateMultiChoice = (value, config) => {
  if (!Array.isArray(value)) {
    throw new Error('Value must be an array');
  }
  
  const options = config.options || [];
  const validValues = options.map(opt => opt.value);
  
  // Check each value is valid
  for (const item of value) {
    if (!validValues.includes(item)) {
      throw new Error(`Invalid option: ${item}`);
    }
  }
  
  // Check min/max selections
  const minSelections = config.minSelections || 0;
  const maxSelections = config.maxSelections || value.length;
  
  if (value.length < minSelections) {
    throw new Error(`Select at least ${minSelections} option(s)`);
  }
  
  if (value.length > maxSelections) {
    throw new Error(`Select at most ${maxSelections} option(s)`);
  }
  
  return value;
};

const validateRating = (value, config) => {
  const max = config.max || 5;
  const num = parseInt(value);
  
  if (isNaN(num) || num < 1 || num > max) {
    throw new Error(`Rating must be between 1 and ${max}`);
  }
  
  return num;
};

const validateDate = (value, config) => {
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (config.minDate && date < new Date(config.minDate)) {
    throw new Error(`Date must be after ${config.minDate}`);
  }
  
  if (config.maxDate && date > new Date(config.maxDate)) {
    throw new Error(`Date must be before ${config.maxDate}`);
  }
  
  return date.toISOString();
};

const validateEmail = (value, config) => {
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  
  if (!emailRegex.test(value)) {
    throw new Error('Invalid email address');
  }
  
  return value;
};

const validateNumber = (value, config) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    throw new Error('Must be a number');
  }
  
  if (config.min !== undefined && num < config.min) {
    throw new Error(`Number must be at least ${config.min}`);
  }
  
  if (config.max !== undefined && num > config.max) {
    throw new Error(`Number must be at most ${config.max}`);
  }
  
  if (config.step && (num - config.min) % config.step !== 0) {
    // Optional: validate step
  }
  
  return num;
};

const validateDropdown = (value, config) => {
  const options = config.options || [];
  const validValues = options.map(opt => opt.value);
  
  if (!validValues.includes(value)) {
    throw new Error('Invalid option selected');
  }
  
  return value;
};

const validateYesNo = (value, config) => {
  if (value !== 'yes' && value !== 'no') {
    throw new Error('Value must be "yes" or "no"');
  }
  
  return value;
};

// Main validation function
function validateAnswer(question, value) {
  const { type, config, is_required } = question;
  
  // Check required
  if (is_required && (value === undefined || value === null || value === '')) {
    throw new Error('This question is required');
  }
  
  // Skip validation if not required and empty
  if (!is_required && (value === undefined || value === null || value === '')) {
    return null;
  }
  
  // Type-specific validation
  switch (type) {
    case 'short_text':
      return validateShortText(value, config);
    case 'long_text':
      return validateLongText(value, config);
    case 'single_choice':
      return validateSingleChoice(value, config);
    case 'multi_choice':
      return validateMultiChoice(value, config);
    case 'rating':
      return validateRating(value, config);
    case 'date':
      return validateDate(value, config);
    case 'email':
      return validateEmail(value, config);
    case 'number':
      return validateNumber(value, config);
    case 'dropdown':
      return validateDropdown(value, config);
    case 'yes_no':
      return validateYesNo(value, config);
    default:
      throw new Error(`Unknown question type: ${type}`);
  }
}

// Zod schema for submission validation
const submissionSchema = z.object({
  answers: z.record(z.string(), z.any()), // question_id -> answer value
});

module.exports = {
  validateAnswer,
  submissionSchema,
};