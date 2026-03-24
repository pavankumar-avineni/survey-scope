const surveyService = require('../services/survey.service');
const { validate, createSurveySchema, updateSurveySchema } = require('../utils/surveyValidation');

class SurveyController {
  async getSurveys(req, res, next) {
    try {
      const { wid } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      
      const result = await surveyService.getSurveys(wid, req.user.id, {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        status,
      });
      
      res.json({
        success: true,
        data: result.data,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async createSurvey(req, res, next) {
    try {
      const validation = validate(createSurveySchema, req.body);
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
      
      const { wid } = req.params;
      const survey = await surveyService.createSurvey(wid, req.user.id, validation.data);
      
      res.status(201).json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getSurvey(req, res, next) {
    try {
      const { wid, sid } = req.params;
      const survey = await surveyService.getSurveyById(sid, wid, req.user.id);
      
      res.json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateSurvey(req, res, next) {
    try {
      const validation = validate(updateSurveySchema, req.body);
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
      
      const { wid, sid } = req.params;
      const survey = await surveyService.updateSurvey(sid, wid, req.user.id, validation.data);
      
      res.json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteSurvey(req, res, next) {
    try {
      const { wid, sid } = req.params;
      await surveyService.deleteSurvey(sid, wid, req.user.id);
      
      res.json({
        success: true,
        data: { message: 'Survey deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
  
  async publishSurvey(req, res, next) {
    try {
      const { wid, sid } = req.params;
      const survey = await surveyService.publishSurvey(sid, wid, req.user.id);
      
      res.json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async closeSurvey(req, res, next) {
    try {
      const { wid, sid } = req.params;
      const survey = await surveyService.closeSurvey(sid, wid, req.user.id);
      
      res.json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async duplicateSurvey(req, res, next) {
    try {
      const { wid, sid } = req.params;
      const survey = await surveyService.duplicateSurvey(sid, wid, req.user.id);
      
      res.status(201).json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SurveyController();