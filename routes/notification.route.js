const express = require("express");
const router = express.Router();

const { authentication } = require("../middleware/auth.middleware");
const notificationController = require("../controllers/notification.controller");

// GET /api/notifications/me
router.get("/me", authentication, notificationController.getMyNotifications);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", authentication, notificationController.markNotificationRead);

// PATCH /api/notifications/read-all
router.patch("/read-all", authentication, notificationController.markAllRead);

// DELETE /api/notifications/:id
router.delete("/:id", authentication, notificationController.deleteNotification);

module.exports = router;