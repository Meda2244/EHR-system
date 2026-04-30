const express = require('express');
const router = express.Router();
const { authentication, adminAuthorized } = require('../middleware/auth.middleware');
const auditController = require('../controllers/audit.controller');

router.get('/', authentication, adminAuthorized, auditController.getAuditLogs);
router.get('/stats', authentication, adminAuthorized, auditController.getAuditStats);
router.get('/user/:userId', authentication, adminAuthorized, auditController.getUserAuditLogs);
router.delete('/cleanup', authentication, adminAuthorized, auditController.cleanupOldLogs);

module.exports = router;