// services/email.service.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// إعداد Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// إرسال بريد ترحيب
const sendWelcomeEmail = async (email, firstName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: '🎉 مرحباً بك في نظام EHR',
      html: `
        <h2>مرحباً بك يا ${firstName}! 👋</h2>
        <p>شكراً لك على التسجيل في نظام السجل الصحي الإلكتروني (EHR)</p>
        <p>يمكنك الآن الوصول إلى جميع الخدمات</p>
        <br>
        <p>مع أطيب التمنيات،<br>فريق EHR System</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ بريد ترحيب إلى: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return false;
  }
};

// إرسال بريد عام
const sendNotificationEmail = async (email, subject, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: `<h2>${subject}</h2><p>${message}</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ بريد إلى: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return false;
  }
};

const sendMedicalReportEmail = async (email, patientName, doctorName, reportTitle) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `📄 تقرير طبي من د. ${doctorName}`,
      html: `<h2>تقرير طبي جديد</h2><p>لقد أضاف د. ${doctorName} تقريراً: ${reportTitle}</p>`
    });
    return true;
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendNotificationEmail,
  sendMedicalReportEmail
};