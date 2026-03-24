const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, requireVerified } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

// Apply auth middleware to all analytics routes
router.use(authenticate);
router.use(requireVerified);

router.get('/', analyticsController.getAnalytics);

module.exports = router;