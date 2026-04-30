// services/cache.service.js

/**
 * خدمة Cache بسيطة في الذاكرة
 * (للإنتاج، استخدم Redis)
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.expirations = new Map();
  }

  /**
   * حفظ البيانات في الكاش
   * @param {string} key - المفتاح
   * @param {any} value - القيمة
   * @param {number} ttl - مدة الصلاحية بالثواني (default: 60)
   */
  set(key, value, ttl = 60) {
    this.cache.set(key, value);

    // حذف البيانات القديمة إن وجدت
    if (this.expirations.has(key)) {
      clearTimeout(this.expirations.get(key));
    }

    // تعيين مدة الانتهاء
    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.expirations.delete(key);
      console.log(`🗑️ تم حذف الكاش: ${key}`);
    }, ttl * 1000);

    this.expirations.set(key, timeout);
    console.log(`✅ تم حفظ الكاش: ${key} (${ttl}s)`);
  }

  /**
   * الحصول على البيانات من الكاش
   * @param {string} key - المفتاح
   * @returns {any} القيمة أو null
   */
  get(key) {
    if (this.cache.has(key)) {
      console.log(`✅ تم الحصول على الكاش: ${key}`);
      return this.cache.get(key);
    }
    console.log(`❌ الكاش غير موجود: ${key}`);
    return null;
  }

  /**
   * حذف البيانات من الكاش
   * @param {string} key - المفتاح
   */
  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      
      if (this.expirations.has(key)) {
        clearTimeout(this.expirations.get(key));
        this.expirations.delete(key);
      }
      
      console.log(`🗑️ تم حذف الكاش: ${key}`);
      return true;
    }
    return false;
  }

  /**
   * حذف جميع البيانات
   */
  clear() {
    this.expirations.forEach(timeout => clearTimeout(timeout));
    this.cache.clear();
    this.expirations.clear();
    console.log('🗑️ تم حذف كل الكاش');
  }

  /**
   * حذف البيانات بناءً على pattern
   * @param {string} pattern - النمط (مثل: user:*)
   */
  deletePattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deletedCount = 0;

    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.delete(key);
        deletedCount++;
      }
    }

    console.log(`🗑️ تم حذف ${deletedCount} عناصر من الكاش`);
    return deletedCount;
  }

  /**
   * الحصول على إحصائيات الكاش
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Middleware للكاش
   */
  middleware(ttl = 60) {
    return (req, res, next) => {
      const key = `${req.method}:${req.originalUrl}`;
      
      // تخطي الـ cache للطلبات غير GET
      if (req.method !== 'GET') {
        return next();
      }

      // محاولة الحصول على البيانات من الكاش
      const cachedData = this.get(key);
      if (cachedData) {
        return res.json(cachedData);
      }

      // حفظ الـ send الأصلي
      const originalSend = res.json.bind(res);

      // استبدال الـ send
      res.json = (data) => {
        this.set(key, data, ttl);
        return originalSend(data);
      };

      next();
    };
  }
}

// إنشاء instance واحد من الخدمة
const cacheService = new CacheService();

module.exports = cacheService;
