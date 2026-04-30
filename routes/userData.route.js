const express = require("express");
const router = express.Router();

const { authentication } = require("../middleware/auth.middleware");
const userDataController = require("../controllers/userData.controller");

router.get("/me", authentication, userDataController.getMyUserData);
router.delete("/:id", authentication, userDataController.deleteMyUserData);

module.exports = router;