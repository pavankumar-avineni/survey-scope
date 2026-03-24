const responseService = require('../services/response.service');

class ResponseController {
  async getResponses(req, res, next) {
    try {
      const { wid, sid } = req.params;
      const { page = 1, limit = 20, startDate, endDate } = req.query;
      
      const result = await responseService.getResponses(sid, wid, req.user.id, {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        startDate,
        endDate,
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
  
  async getResponse(req, res, next) {
    try {
      const { wid, sid, rid } = req.params;
      const response = await responseService.getResponseById(rid, sid, wid, req.user.id);
      
      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      if (error.message === 'RESPONSE_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESPONSE_NOT_FOUND',
            message: 'Response not found',
          },
        });
      }
      next(error);
    }
  }
  
  async deleteResponse(req, res, next) {
    try {
      const { wid, sid, rid } = req.params;
      await responseService.deleteResponse(rid, sid, wid, req.user.id);
      
      res.json({
        success: true,
        data: { message: 'Response deleted successfully' },
      });
    } catch (error) {
      if (error.message === 'RESPONSE_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESPONSE_NOT_FOUND',
            message: 'Response not found',
          },
        });
      }
      next(error);
    }
  }
  
  async exportCSV(req, res, next) {
    try {
      const { wid, sid } = req.params;
      const { startDate, endDate } = req.query;
      
      const csv = await responseService.exportToCSV(sid, wid, req.user.id, {
        startDate,
        endDate,
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=survey_${sid}_responses.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ResponseController();