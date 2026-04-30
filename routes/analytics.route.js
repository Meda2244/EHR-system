const express = require('express');
const router = express.Router();
const { authentication, adminAuthorized, doctorAuthorized } = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

// مسارات المسؤول العام (Super Admin)
router.get('/super-admin', authentication, adminAuthorized, analyticsController.getSuperAdminDashboard);
router.post('/refresh', authentication, adminAuthorized, analyticsController.refreshAnalytics);

// مسار الدكتور
router.get('/doctor', authentication, doctorAuthorized, analyticsController.getDoctorDashboard);

// مسار مدير المستشفى
router.get('/hospital', authentication, adminAuthorized, analyticsController.getHospitalDashboard);

// إحصائيات سريعة (للجميع)
router.get('/quick', authentication, analyticsController.getQuickStats);

module.exports = router;