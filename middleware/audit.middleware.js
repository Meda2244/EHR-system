const AuditLog = require('../models/auditLog.model');

const auditMiddleware = (action, resourceType) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        const startTime = Date.now();
        
        res.json = async function(data) {
            const duration = Date.now() - startTime;
            
            // تسجيل العملية
            try {
                const auditEntry = {
                    userId: req.user?._id,
                    userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown',
                    userRole: req.user?.role?.[0] || 'Unknown',
                    action,
                    resourceType,
                    resourceId: req.params.id || req.body?.id,
                    resourceName: req.body?.title || req.body?.name,
                    details: {
                        method: req.method,
                        url: req.originalUrl,
                        body: sanitizeBody(req.body),
                        query: req.query,
                        duration: `${duration}ms`,
                        statusCode: res.statusCode
                    },
                    ipAddress: req.ip || req.connection?.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    status: res.statusCode >= 400 ? 'FAILED' : 'SUCCESS'
                };
                
                if (res.statusCode >= 400 && data?.message) {
                    auditEntry.errorMessage = data.message;
                }
                
                await AuditLog.create(auditEntry);
            } catch (error) {
                console.error('Audit log error:', error);
            }
            
            originalJson.call(this, data);
        };
        
        next();
    };
};

// تنظيف البيانات الحساسة قبل التسجيل
function sanitizeBody(body) {
    if (!body) return {};
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'token', 'resetCode'];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) sanitized[field] = '***REDACTED***';
    });
    return sanitized;
}

module.exports = auditMiddleware;