const express = require('express');
const router = express.Router();
const { authentication, doctorAuthorized } = require('../middleware/auth.middleware');
const appointmentController = require('../controllers/appointment.controller');

// مسارات عامة
router.post('/check-availability', authentication, appointmentController.checkAvailability);

// مسارات المريض
router.post('/', authentication, appointmentController.createAppointment);
router.get('/my', authentication, appointmentController.getMyAppointments);
router.delete('/:id/cancel', authentication, appointmentController.cancelAppointment);

// مسارات الدكتور
router.get('/doctor', authentication, doctorAuthorized, appointmentController.getDoctorAppointments);
router.patch('/:id/status', authentication, doctorAuthorized, appointmentController.updateAppointmentStatus);

module.exports = router;