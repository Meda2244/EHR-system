const express = require('express');
const router = express.Router();
const { authentication, adminAuthorized, doctorAuthorized, doctorOrNurseAuthorized } = require('../middleware/auth.middleware');
const waitlistController = require('../controllers/waitlist.controller');

// مسارات المريض
router.post('/', authentication, waitlistController.addToWaitlist);

// مسارات المستشفى والطبيب
router.get('/hospital/:hospitalId', authentication, doctorOrNurseAuthorized, waitlistController.getHospitalWaitlist);
router.get('/doctor/:doctorId', authentication, doctorAuthorized, waitlistController.getDoctorWaitlist);
router.get('/stats/:hospitalId', authentication, adminAuthorized, waitlistController.getWaitlistStats);

// مسارات الإدارة
router.patch('/:id', authentication, adminAuthorized, waitlistController.updateWaitlistStatus);
router.delete('/:id', authentication, adminAuthorized, waitlistController.removeFromWaitlist);
router.post('/hospital/:hospitalId/notify-next', authentication, adminAuthorized, waitlistController.notifyNextPatient);

module.exports = router;