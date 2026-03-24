const express = require('express');
const publicController = require('../controllers/public.controller');
const { publicSubmissionLimiter } = require('../middleware/publicRateLimiter');

const router = express.Router();

router.get('/s/:slug', publicController.getSurvey);
router.post('/s/:slug/submit', publicSubmissionLimiter, publicController.submitResponse);

module.exports = router;