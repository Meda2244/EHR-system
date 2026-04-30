const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userRole: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'SHARE']
    },
    resourceType: {
        type: String,
        required: true,
        enum: ['USER', 'REPORT', 'APPOINTMENT', 'HOSPITAL', 'PATIENT_DATA', 'SETTINGS']
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    resourceName: {
        type: String
    },
    details: {
        type: Object,
        default: {}
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        default: 'SUCCESS'
    },
    errorMessage: {
        type: String
    }
}, { timestamps: true });

// فهارس لتحسين الأداء
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);