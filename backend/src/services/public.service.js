const db = require('../models/db');
const { validateAnswer } = require('../utils/responseValidation');
const { generateFingerprint, hashIP } = require('../utils/fingerprint');

class PublicService {
  async getSurveyBySlug(slug) {
    const survey = await db('surveys')
      .where({ slug })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Check if survey is closed
    if (survey.status === 'closed') {
      throw new Error('SURVEY_CLOSED');
    }
    
    // Check if survey has close date in settings
    const settings = typeof survey.settings === 'string'
      ? JSON.parse(survey.settings)
      : survey.settings;
    
    if (settings.closeDate && new Date(settings.closeDate) < new Date()) {
      throw new Error('SURVEY_CLOSED');
    }
    
    // Get questions
    const questions = await db('questions')
      .where({ survey_id: survey.id })
      .orderBy('order_index', 'asc');
    
    // Parse JSONB fields
    survey.settings = settings;
    questions.forEach(q => {
      q.config = typeof q.config === 'string' ? JSON.parse(q.config) : q.config;
    });
    
    return { ...survey, questions };
  }
  
  async submitResponse(slug, answers, req, surveySettings) {
    // Get survey with questions
    const survey = await db('surveys')
      .where({ slug })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Check if survey is active
    if (survey.status !== 'active') {
      throw new Error('SURVEY_CLOSED');
    }
    
    // Parse survey settings
    const settings = typeof survey.settings === 'string'
      ? JSON.parse(survey.settings)
      : survey.settings;
    
    // Check close date
    if (settings.closeDate && new Date(settings.closeDate) < new Date()) {
      throw new Error('SURVEY_CLOSED');
    }
    
    // Get all questions
    const questions = await db('questions')
      .where({ survey_id: survey.id })
      .orderBy('order_index', 'asc');
    
    // Create question lookup map
    const questionMap = {};
    questions.forEach(q => {
      questionMap[q.id] = q;
    });
    
    // Validate all answers
    const validatedAnswers = [];
    const missingRequired = [];
    
    for (const question of questions) {
      const answerValue = answers[question.id];
      
      try {
        const validated = validateAnswer(question, answerValue);
        if (validated !== null) {
          validatedAnswers.push({
            questionId: question.id,
            value: typeof validated === 'object' 
              ? JSON.stringify(validated) 
              : String(validated),
          });
        }
      } catch (error) {
        throw new Error(`QUESTION_VALIDATION_FAILED:${question.id}:${error.message}`);
      }
      
      // Track missing required
      if (question.is_required && (answerValue === undefined || answerValue === null || answerValue === '')) {
        missingRequired.push(question.id);
      }
    }
    
    if (missingRequired.length > 0) {
      throw new Error(`REQUIRED_QUESTIONS_MISSING:${missingRequired.join(',')}`);
    }
    
    // Check for duplicate responses if setting enabled
    if (!settings.allowMultipleResponses) {
      const fingerprint = generateFingerprint(req, survey.id);
      
      const existingResponse = await db('responses')
        .where({ survey_id: survey.id, session_token: fingerprint })
        .first();
      
      if (existingResponse) {
        throw new Error('DUPLICATE_RESPONSE');
      }
      
      // Start transaction
      const trx = await db.transaction();
      
      try {
        // Create response with session token
        const [response] = await trx('responses')
          .insert({
            survey_id: survey.id,
            session_token: fingerprint,
            metadata: JSON.stringify({
              ip_hash: hashIP(req.ip),
              user_agent: req.headers['user-agent'],
              submitted_at: new Date().toISOString(),
            }),
          })
          .returning('*');
        
        // Create answers
        for (const answer of validatedAnswers) {
          await trx('answers').insert({
            response_id: response.id,
            question_id: answer.questionId,
            value: answer.value,
          });
        }
        
        await trx.commit();
        
        return {
          success: true,
          message: settings.thankYouMessage || 'Thank you for completing this survey!',
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } else {
      // Allow multiple responses - no session token
      const trx = await db.transaction();
      
      try {
        const [response] = await trx('responses')
          .insert({
            survey_id: survey.id,
            session_token: null,
            metadata: JSON.stringify({
              ip_hash: hashIP(req.ip),
              user_agent: req.headers['user-agent'],
              submitted_at: new Date().toISOString(),
            }),
          })
          .returning('*');
        
        for (const answer of validatedAnswers) {
          await trx('answers').insert({
            response_id: response.id,
            question_id: answer.questionId,
            value: answer.value,
          });
        }
        
        await trx.commit();
        
        return {
          success: true,
          message: settings.thankYouMessage || 'Thank you for completing this survey!',
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    }
  }
}

module.exports = new PublicService();