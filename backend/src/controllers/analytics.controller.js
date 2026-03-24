const analyticsService = require('../services/analytics.service');

class AnalyticsController {
  async getAnalytics(req, res, next) {
    try {
      const { wid, sid } = req.params;
      const analytics = await analyticsService.getAnalytics(sid, wid, req.user.id);
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();