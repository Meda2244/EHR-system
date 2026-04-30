const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const { authentication, adminAuthorized } = require("../middleware/auth.middleware");
const adminController = require("../controllers/admin.controller");

// add user data (text + multiple images)
router.post(
  "/users/:userId/data",
  authentication,
  adminAuthorized,
  upload.any(),
  adminController.addUserDataByAdmin
);

// promote to doctor/nurse
router.patch(
  "/users/:userId/promote",
  authentication,
  adminAuthorized,
  adminController.promoteUserRole
);

module.exports = router;