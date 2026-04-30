const express = require('express');
const router = express.Router();
const { authentication, adminAuthorized } = require('../middleware/auth.middleware');
const settingsController = require('../controllers/settings.controller');

router.get('/', authentication, adminAuthorized, settingsController.getSettings);
router.put('/', authentication, adminAuthorized, settingsController.updateSettings);
router.patch('/language', authentication, adminAuthorized, settingsController.updateLanguage);
router.patch('/version', authentication, adminAuthorized, settingsController.updateSystemVersion);

module.exports = router;