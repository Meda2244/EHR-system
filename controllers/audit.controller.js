const AuditLog = require('../models/auditLog.model');
const User = require('../models/user.model');

const auditController = {

    // 1. عرض سجل التدقيق (للمسؤول فقط)
    getAuditLogs: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                userId,
                action,
                resourceType,
                startDate,
                endDate,
                status
            } = req.query;
            
            const query = {};
            if (userId) query.userId = userId;
            if (action) query.action = action;
            if (resourceType) query.resourceType = resourceType;
            if (status) query.status = status;
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }
            
            const logs = await AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));
            
            const total = await AuditLog.countDocuments(query);
            
            res.json({
                data: logs,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. عرض سجل التدقيق لمستخدم معين
    getUserAuditLogs: async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            
            const logs = await AuditLog.find({ userId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));
            
            res.json({ data: logs });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. إحصائيات سجل التدقيق
    getAuditStats: async (req, res) => {
        try {
            const totalLogs = await AuditLog.countDocuments();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayLogs = await AuditLog.countDocuments({
                createdAt: { $gte: today }
            });
            
            const actionsStats = await AuditLog.aggregate([
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);
            
            res.json({
                data: {
                    totalLogs,
                    todayLogs,
                    actionsStats
                }
            });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. تنظيف سجل التدقيق القديم (للمسؤول)
    cleanupOldLogs: async (req, res) => {
        try {
            const { days = 90 } = req.body;
            const date = new Date();
            date.setDate(date.getDate() - days);
            
            const result = await AuditLog.deleteMany({
                createdAt: { $lt: date }
            });
            
            res.json({
                message: `تم حذف ${result.deletedCount} سجل قديم`,
                deletedCount: result.deletedCount
            });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = auditController;