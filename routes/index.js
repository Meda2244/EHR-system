const express = require("express");
const router = express.Router();

const { 
  authentication, 
  adminAuthorized,
  doctorAuthorized,
  nurseAuthorized,
  doctorOrAdminAuthorized,
  doctorOrNurseAuthorized
} = require("../middleware/auth.middleware");
const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const emailService = require("../services/email.service");

// ============ Auth Routes ============
const authRouter = require("./auth.route");
router.use("/auth", authRouter);

// ============ User Routes ============
const userRouter = require("./user.route");
router.use("/user", userRouter);

// ============ Post Routes ============
const postRouter = require("./post.route");
router.use("/posts", postRouter);

// ============ Admin Routes ============
const adminRouter = require("./admin.route");
router.use("/admin", adminRouter);

// ============ User Data Routes ============
const userDataRouter = require("./userData.route");
router.use("/user-data", userDataRouter);

// ============ Appointment Routes ============
const appointmentRouter = require("./appointment.route");
router.use("/appointments", appointmentRouter);

// ============ Hospital Routes ============
const hospitalRouter = require("./hospital.route");
router.use("/hospitals", hospitalRouter);

// ============ Report Routes ============
const reportRouter = require("./report.route");
router.use("/reports", reportRouter);

// ============ Notification Routes ============
const notificationRouter = require("./notification.route");
router.use("/notifications", notificationRouter);

// ============ Waitlist Routes ============
const waitlistRouter = require("./waitlist.route");
router.use("/waitlist", waitlistRouter);

// ============ Analytics Routes ============
const analyticsRouter = require("./analytics.route");
router.use("/analytics", analyticsRouter);

// ============ Assistant Routes ============
const assistantRouter = require("./assistant.route");
router.use("/assistant", assistantRouter);

// ============ Settings Routes ============
const settingsRouter = require("./settings.route");
router.use("/settings", settingsRouter);

// ============ Audit Routes ============
const auditRouter = require("./audit.route");
router.use("/audit", auditRouter);

// ============ Search Routes ============
router.get("/user/search/:nationalId", authentication, async (req, res) => {
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

// ============ Forgot Password Routes ============
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📧 Forgot password for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "البريد غير موجود" });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Code: ${resetCode}`);
    
    user.resetCode = resetCode;
    user.resetCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    console.log("✅ Code saved");

    await emailService.sendNotificationEmail(
      email,
      "🔐 كود إعادة تعيين كلمة المرور",
      `<h2 style="text-align:center; color:#007bff;">كودك: <strong style="font-size:32px;">${resetCode}</strong></h2><p>صالح 10 دقائق فقط</p>`
    );

    console.log("✅ Email sent");
    res.json({ message: "✅ تم إرسال الكود إلى بريدك" });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;
    console.log("🔄 Reset password for:", email);

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "❌ كلمات المرور غير متطابقة" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }

    const user = await User.findOne({
      email,
      resetCode: code,
      resetCodeExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "❌ كود خاطئ أو انتهى" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    await user.save();

    await emailService.sendNotificationEmail(
      email,
      "✅ تم تغيير كلمة المرور",
      "<h2 style='color:#28a745;'>تم التغيير بنجاح</h2><p>يمكنك تسجيل الدخول بالكلمة الجديدة</p>"
    );

    console.log("✅ Password changed");
    res.json({ message: "✅ تم تغيير كلمة المرور بنجاح" });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ============ Admin Management Routes ============
router.get("/admin/users/all", authentication, adminAuthorized, async (req, res) => {
  try {
    const users = await User.find({}).select("-password -tokens");
    res.json({ message: "✅ All users", data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/admin/promote/:userId", authentication, adminAuthorized, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!["doctor", "nurse"].includes(role)) {
      return res.status(400).json({ message: "❌ Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $addToSet: { role: role } },
      { new: true }
    ).select("-password -tokens");
    
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    await Notification.create({
      user: user._id,
      title: "تم ترقية حسابك",
      message: `تمت ترقيتك إلى ${role === 'doctor' ? 'طبيب' : 'ممرض'}`,
      type: "ROLE_UPDATED"
    });

    res.json({ 
      message: `✅ User promoted to ${role}`,
      user 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/admin/users/:userId", authentication, adminAuthorized, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }
    res.json({ message: "✅ User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ Patient Routes ============
router.get("/patients/list", authentication, doctorOrNurseAuthorized, async (req, res) => {
  try {
    const patients = await User.find({ role: "user" }).select("-password -tokens");
    res.json({ message: "✅ Patients list", data: patients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/nurse/patients", authentication, nurseAuthorized, async (req, res) => {
  try {
    const patients = await User.find({ role: "user" }).select("-password -tokens");
    res.json({ message: "✅ Patients data", data: patients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ Medical Reports Routes ============
router.post("/medical-reports", authentication, doctorOrAdminAuthorized, (req, res) => {
  res.json({ 
    message: "✅ Medical report created",
    receivedData: req.body 
  });
});

router.get("/medical-reports/my-reports", authentication, (req, res) => {
  res.json({ message: "✅ My reports", data: [] });
});

router.get("/medical-reports/test", (req, res) => {
  res.json({ message: "✅ Medical reports working!" });
});

// ============ Notifications Test Routes ============
router.get("/notifications/test", (req, res) => {
  res.json({ message: "✅ Notification route working!" });
});

console.log("✅ All routes registered successfully");

module.exports = router;