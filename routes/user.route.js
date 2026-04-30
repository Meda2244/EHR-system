const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { authentication, adminAuthorized } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const User = require("../models/user.model");

// البحث البسيط جداً
router.get("/search/:nationalId", authentication, async (req, res) => {
  try {
    const user = await User.findOne({ nationalId: req.params.nationalId });
    
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }
    
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/allUser", authentication, adminAuthorized, userController.getAllUser);
router.post("/update/password", authentication, userController.updatePassword);

router
  .route("/")
  .patch(authentication, upload.single("image"), userController.updateUser)
  .get(authentication, userController.getUser);

router
  .route("/:id")
  .delete(authentication, adminAuthorized, userController.deleteUser);

module.exports = router;