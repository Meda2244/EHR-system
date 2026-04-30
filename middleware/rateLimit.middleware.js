// middleware/rateLimit.middleware.js

const rateLimit = require('express-rate-limit');

// Rate limiter عام
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب لكل IP في كل 15 دقيقة
  message: {
    message: 'عدد الطلبات كثير جداً، حاول لاحقاً'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter للتسجيل والدخول (أكثر صرامة)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات فقط
  message: {
    message: 'عدد محاولات الدخول كثير، حاول بعد 15 دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // تجاهل الطلبات من IPs معينة (مثل localhost للتطوير)
    return req.ip === '::1' || req.ip === '127.0.0.1';
  }
});

// Rate limiter لرفع الملفات
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 20, // 20 رفع فقط في الساعة
  message: {
    message: 'عدد الملفات المرفوعة كثير، حاول بعد ساعة'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter لـ API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 30, // 30 طلب في الدقيقة
  message: {
    message: 'عدد الطلبات كثير جداً، حاول لاحقاً'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  apiLimiter
};
