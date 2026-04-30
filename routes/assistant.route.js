const express = require('express');
const router = express.Router();
const { authentication, nurseAuthorized } = require('../middleware/auth.middleware');
const assistantController = require('../controllers/assistant.controller');

// جميع المسارات تحتاج صلاحية مساعد (Nurse)
router.use(authentication, nurseAuthorized);

router.post('/check-in', assistantController.patientCheckIn);
router.get('/search', assistantController.searchPatient);
router.get('/appointments/today', assistantController.getTodayAvailableAppointments);
router.get('/waitlist', assistantController.getWaitlist);
router.patch('/waitlist/:id', assistantController.updateWaitlistStatus);
router.get('/stats', assistantController.getAssistantStats);

module.exports = router;