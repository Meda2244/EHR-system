const express = require('express');
const router = express.Router();
const userController = require('../controllers/auth.controller');
const { newUserValidation } = require('../middleware/validation.middleware');
const { loginUserValidation } = require('../middleware/validation.middleware');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const emailService = require("../services/email.service");

router.post("/signup", newUserValidation, userController.newUser);
router.post("/login", loginUserValidation, userController.login);

// 🔐 نسيان كلمة المرور - إرسال كود للبريد
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📧 Forgot password request for:", email);

    if (!email) {
      return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "البريد الإلكتروني غير موجود" });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Generated reset code: ${resetCode}`);
    
    user.resetCode = resetCode;
    user.resetCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    console.log("✅ Reset code saved to database");

    const emailSent = await emailService.sendNotificationEmail(
      email,
      "🔐 كود إعادة تعيين كلمة المرور",
      `
      <h2 style="text-align: center; color: #007bff;">كود إعادة تعيين كلمة المرور</h2>
      <p>مرحباً ${user.firstName},</p>
      <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.</p>
      <p style="text-align: center;">
        <strong style="font-size: 32px; color: #007bff; letter-spacing: 5px;">${resetCode}</strong>
      </p>
      <p><strong>الكود صالح لمدة 10 دقائق فقط</strong></p>
      <p>إذا لم تطلب هذا، تجاهل هذا البريد.</p>
      <br>
      <p>مع أطيب التمنيات،<br>فريق EHR System</p>
      `
    );

    console.log(`✅ Reset code email sent to ${email}`);
    res.status(200).json({ 
      message: "تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني",
      email: email
    });

  } catch (error) {
    console.error("❌ Forgot password error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// 🔄 إعادة تعيين كلمة المرور باستخدام الكود
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    console.log("🔄 Reset password request for:", email);

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "كلمات المرور غير متطابقة" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }

    const user = await User.findOne({
      email,
      resetCode: code,
      resetCodeExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log("❌ Invalid reset code or expired");
      return res.status(400).json({ message: "الكود غير صحيح أو انتهت صلاحيته" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    await user.save();

    console.log("✅ Password reset successfully");

    await emailService.sendNotificationEmail(
      email,
      "✅ تم تغيير كلمة المرور بنجاح",
      `
      <h2 style="text-align: center; color: #28a745;">تم تغيير كلمة المرور بنجاح</h2>
      <p>مرحباً ${user.firstName},</p>
      <p>تم تغيير كلمة المرور الخاصة بك بنجاح.</p>
      <p>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
      <p><strong>إذا لم تقم بهذا التغيير، يرجى الاتصال بنا على الفور.</strong></p>
      <br>
      <p>مع أطيب التمنيات،<br>فريق EHR System</p>
      `
    );

    console.log(`✅ Confirmation email sent to ${email}`);
    res.status(200).json({ message: "تم تغيير كلمة المرور بنجاح" });

  } catch (error) {
    console.error("❌ Reset password error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;