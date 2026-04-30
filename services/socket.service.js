
// services/socket.service.js

const io = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
  constructor(server) {
    this.io = io(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.userSockets = new Map(); // map of userId -> socketId
    this.setupMiddleware();
    this.setupEvents();
  }

  /**
   * إعداد middleware للتحقق من التوكن
   */
  setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('❌ توكن مفقود'));
      }

      try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        socket.userId = decoded.id;
        socket.userEmail = decoded.email;
        next();
      } catch (error) {
        next(new Error('❌ توكن غير صحيح'));
      }
    });
  }

  /**
   * إعداد الأحداث
   */
  setupEvents() {
    this.io.on('connection', (socket) => {
      console.log(`✅ المستخدم متصل: ${socket.userEmail} (${socket.id})`);

      // حفظ الاتصال
      this.userSockets.set(socket.userId, socket.id);

      // إرسال إشعار بالاتصال
      socket.emit('connected', {
        message: 'مرحباً بك في النظام!',
        userId: socket.userId
      });

      // ────────────────────────────────────────────
      // أحداث الإشعارات
      // ────────────────────────────────────────────

      /**
       * استقبال إشعار جديد
       */
      socket.on('notification', (data) => {
        const { recipientId, title, message, type } = data;
        
        const socketId = this.userSockets.get(recipientId);
        if (socketId) {
          this.io.to(socketId).emit('new-notification', {
            title,
            message,
            type,
            timestamp: new Date(),
            read: false
          });
          
          console.log(`📢 إشعار تم إرساله إلى: ${recipientId}`);
        }
      });

      /**
       * إشعار المستخدمين بعضهم ببعض (مثل الدردشة)
       */
      socket.on('send-message', (data) => {
        const { to, message, from } = data;
        
        const socketId = this.userSockets.get(to);
        if (socketId) {
          this.io.to(socketId).emit('receive-message', {
            from,
            message,
            timestamp: new Date()
          });
          
          console.log(`💬 رسالة من ${from} إلى ${to}`);
        }
      });

      /**
       * تحديث حالة المستخدم (online/offline)
       */
      socket.on('user-status', (status) => {
        this.io.emit('user-status-changed', {
          userId: socket.userId,
          status,
          timestamp: new Date()
        });
        
        console.log(`👤 حالة ${socket.userEmail}: ${status}`);
      });

      /**
       * إشعارات التقارير الطبية
       */
      socket.on('new-medical-report', (data) => {
        const { recipientId, reportTitle, doctorName } = data;
        
        const socketId = this.userSockets.get(recipientId);
        if (socketId) {
          this.io.to(socketId).emit('medical-report-notification', {
            title: 'تقرير طبي جديد',
            message: `د. ${doctorName} أضاف تقريراً: ${reportTitle}`,
            type: 'MEDICAL_REPORT'
          });
          
          console.log(`🏥 تقرير جديد لـ: ${recipientId}`);
        }
      });

      /**
       * تنبيهات المنشورات (تم التعديل من new-tweet إلى new-post)
       */
      socket.on('new-post', (data) => {
        const { followers, postTitle } = data;
        
        followers.forEach(followerId => {
          const socketId = this.userSockets.get(followerId);
          if (socketId) {
            this.io.to(socketId).emit('post-notification', {
              title: 'منشور جديد',
              message: `منشور جديد: ${postTitle}`,
              from: socket.userEmail
            });
          }
        });
        
        console.log(`📝 منشور جديد من ${socket.userEmail}`);
      });

      /**
       * إشعارات عامة للمسؤولين
       */
      socket.on('admin-notification', (data) => {
        const { title, message, adminIds } = data;
        
        adminIds.forEach(adminId => {
          const socketId = this.userSockets.get(adminId);
          if (socketId) {
            this.io.to(socketId).emit('admin-alert', {
              title,
              message,
              from: socket.userEmail,
              timestamp: new Date()
            });
          }
        });
        
        console.log(`🚨 تنبيه إداري من ${socket.userEmail}`);
      });

      /**
       * البث للجميع (مثل الإعلانات)
       */
      socket.on('broadcast', (data) => {
        if (socket.isAdmin) {
          this.io.emit('broadcast-message', {
            title: data.title,
            message: data.message,
            from: 'النظام'
          });
          
          console.log(`📡 بث عام من: ${socket.userEmail}`);
        }
      });

      // ────────────────────────────────────────────
      // أحداث قطع الاتصال
      // ────────────────────────────────────────────

      socket.on('disconnect', () => {
        this.userSockets.delete(socket.userId);
        console.log(`❌ المستخدم قطع الاتصال: ${socket.userEmail}`);
        
        // إخطار الآخرين
        this.io.emit('user-disconnected', {
          userId: socket.userId,
          email: socket.userEmail,
          timestamp: new Date()
        });
      });

      socket.on('error', (error) => {
        console.error(`❌ خطأ في Socket: ${error}`);
      });
    });
  }

  /**
   * إرسال إشعار مباشر لمستخدم معين
   */
  sendNotification(userId, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', data);
      return true;
    }
    return false;
  }

  /**
   * إرسال إشعار لمجموعة مستخدمين
   */
  sendNotificationToMany(userIds, data) {
    userIds.forEach(userId => {
      this.sendNotification(userId, data);
    });
  }

  /**
   * البث للجميع
   */
  broadcast(eventName, data) {
    this.io.emit(eventName, data);
  }

  /**
   * الحصول على إحصائيات الاتصال
   */
  getStats() {
    return {
      connectedUsers: this.userSockets.size,
      totalConnections: this.io.engine.clientsCount,
      userIds: Array.from(this.userSockets.keys())
    };
  }
}

module.exports = SocketService;