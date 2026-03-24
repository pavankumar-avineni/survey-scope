const express = require('express');
const surveyController = require('../controllers/survey.controller');

const router = express.Router();

// Get all surveys
router.get('/', surveyController.getSurveys);

// Create survey
router.post('/', surveyController.createSurvey);

// Get single survey
router.get('/:sid', surveyController.getSurvey);

// Update survey
router.put('/:sid', surveyController.updateSurvey);

// Delete survey
router.delete('/:sid', surveyController.deleteSurvey);

// Publish survey
router.post('/:sid/publish', surveyController.publishSurvey);

// Close survey
router.post('/:sid/close', surveyController.closeSurvey);

// Duplicate survey
router.post('/:sid/duplicate', surveyController.duplicateSurvey);

module.exports = router;