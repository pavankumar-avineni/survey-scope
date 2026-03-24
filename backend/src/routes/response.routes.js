const express = require('express');
const responseController = require('../controllers/response.controller');
const { authenticate, requireVerified } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

// Apply auth middleware to all response routes
router.use(authenticate);
router.use(requireVerified);

router.get('/', responseController.getResponses);
router.get('/export', responseController.exportCSV);
router.get('/:rid', responseController.getResponse);
router.delete('/:rid', responseController.deleteResponse);

module.exports = router;