const publicService = require('../services/public.service');

class PublicController {
  async getSurvey(req, res, next) {
    try {
      const { slug } = req.params;
      const survey = await publicService.getSurveyBySlug(slug);
      
      res.json({
        success: true,
        data: survey,
      });
    } catch (error) {
      if (error.message === 'SURVEY_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SURVEY_NOT_FOUND',
            message: 'Survey not found',
          },
        });
      }
      
      if (error.message === 'SURVEY_CLOSED') {
        return res.status(410).json({
          success: false,
          error: {
            code: 'SURVEY_CLOSED',
            message: 'This survey is no longer accepting responses',
          },
        });
      }
      
      next(error);
    }
  }
  
  async submitResponse(req, res, next) {
    try {
      const { slug } = req.params;
      const { answers } = req.body;
      
      if (!answers || typeof answers !== 'object') {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Answers object is required',
          },
        });
      }
      
      const result = await publicService.submitResponse(slug, answers, req);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === 'SURVEY_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SURVEY_NOT_FOUND',
            message: 'Survey not found',
          },
        });
      }
      
      if (error.message === 'SURVEY_CLOSED') {
        return res.status(410).json({
          success: false,
          error: {
            code: 'SURVEY_CLOSED',
            message: 'This survey is no longer accepting responses',
          },
        });
      }
      
      if (error.message === 'DUPLICATE_RESPONSE') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_RESPONSE',
            message: 'You have already submitted a response to this survey',
          },
        });
      }
      
      if (error.message.startsWith('QUESTION_VALIDATION_FAILED')) {
        const [, questionId, validationError] = error.message.split(':');
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError,
            questionId: questionId,
          },
        });
      }
      
      if (error.message.startsWith('REQUIRED_QUESTIONS_MISSING')) {
        const [, questionIds] = error.message.split(':');
        return res.status(422).json({
          success: false,
          error: {
            code: 'REQUIRED_QUESTIONS_MISSING',
            message: 'Required questions are missing',
            questionIds: questionIds.split(','),
          },
        });
      }
      
      next(error);
    }
  }
}

module.exports = new PublicController();