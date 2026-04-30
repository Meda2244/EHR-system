const express = require('express');
const router = express.Router();
const { authentication, adminAuthorized } = require('../middleware/auth.middleware');
const hospitalController = require('../controllers/hospital.controller');

// مسارات عامة (للجميع)
router.get('/', authentication, hospitalController.getAllHospitals);
router.get('/governorates', authentication, hospitalController.getGovernorates);
router.get('/:id', authentication, hospitalController.getHospitalById);
router.get('/:id/stats', authentication, hospitalController.getHospitalStats);

// مسارات للمسؤول فقط
router.post('/', authentication, adminAuthorized, hospitalController.createHospital);
router.put('/:id', authentication, adminAuthorized, hospitalController.updateHospital);
router.delete('/:id', authentication, adminAuthorized, hospitalController.deleteHospital);

module.exports = router;