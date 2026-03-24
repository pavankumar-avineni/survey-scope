const questionService = require('../services/question.service');
const { validate, createQuestionSchema, updateQuestionSchema, reorderQuestionsSchema } = require('../utils/surveyValidation');

class QuestionController {
  async addQuestion(req, res, next) {
    try {
      const validation = validate(createQuestionSchema, req.body);
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
      
      const { sid } = req.params;
      const { wid } = req.query; // workspace ID from query param
      
      const question = await questionService.addQuestion(sid, wid, req.user.id, validation.data);
      
      res.status(201).json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateQuestion(req, res, next) {
    try {
      const validation = validate(updateQuestionSchema, req.body);
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
      
      const { sid, qid } = req.params;
      const { wid } = req.query;
      
      const question = await questionService.updateQuestion(qid, sid, wid, req.user.id, validation.data);
      
      res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteQuestion(req, res, next) {
    try {
      const { sid, qid } = req.params;
      const { wid } = req.query;
      
      await questionService.deleteQuestion(qid, sid, wid, req.user.id);
      
      res.json({
        success: true,
        data: { message: 'Question deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
  
  async reorderQuestions(req, res, next) {
    try {
      const validation = validate(reorderQuestionsSchema, req.body);
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
      
      const { sid } = req.params;
      const { wid } = req.query;
      
      const questions = await questionService.reorderQuestions(
        sid,
        wid,
        req.user.id,
        validation.data.questionIds
      );
      
      res.json({
        success: true,
        data: questions,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuestionController();