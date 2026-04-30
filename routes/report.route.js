const express = require('express');
const router = express.Router();
const { authentication, adminAuthorized } = require('../middleware/auth.middleware');
const reportController = require('../controllers/report.controller');

// All routes require authentication
router.use(authentication);

// Create new report (admin only) - POST /
router.post('/', adminAuthorized, reportController.createReport);

// Get my reports - GET /my-reports
router.get('/my-reports', reportController.getMyReports);

// Get single report - GET /:reportId
router.get('/:reportId', reportController.getReport);

// Download report PDF - GET /:reportId/download
router.get('/:reportId/download', reportController.downloadReport);

module.exports = router;