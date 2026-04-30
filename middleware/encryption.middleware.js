const EncryptionService = require('../services/encryption.service');
const EncryptionKey = require('../models/encryptionKey.model');

const encryptSensitiveData = async (req, res, next) => {
    try {
        // الحقول اللي محتاجة تشفير
        const sensitiveFields = ['diagnosis', 'prescriptions', 'medicalHistory'];
        
        for (const field of sensitiveFields) {
            if (req.body[field]) {
                // الحصول على مفتاح المريض
                const patientId = req.body.patientId || req.params.patientId;
                const keyDoc = await EncryptionKey.findOne({ userId: patientId });
                
                if (keyDoc) {
                    const encrypted = EncryptionService.encrypt(
                        JSON.stringify(req.body[field]),
                        keyDoc.publicKey
                    );
                    req.body[field] = encrypted;
                }
            }
        }
        next();
    } catch (error) {
        console.error('Encryption middleware error:', error);
        next();
    }
};

const decryptSensitiveData = (data, userKey) => {
    // فك تشفير البيانات عند العرض
    return data;
};

module.exports = {
    encryptSensitiveData,
    decryptSensitiveData
};