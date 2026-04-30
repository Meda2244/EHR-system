const crypto = require('crypto');

const algorithm = 'aes-256-gcm';

class EncryptionService {
    
    // توليد مفتاح تشفير جديد لمستخدم
    static generateKey() {
        const key = crypto.randomBytes(32).toString('hex');
        const iv = crypto.randomBytes(16).toString('hex');
        return { key, iv };
    }

    // تشفير البيانات
    static encrypt(text, key) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    // فك تشفير البيانات
    static decrypt(encryptedData, key) {
        try {
            const decipher = crypto.createDecipheriv(
                algorithm,
                Buffer.from(key, 'hex'),
                Buffer.from(encryptedData.iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    // تشفير سجل طبي
    static encryptMedicalRecord(record, patientKey) {
        const recordString = JSON.stringify(record);
        return this.encrypt(recordString, patientKey);
    }

    // فك تشفير سجل طبي
    static decryptMedicalRecord(encryptedRecord, patientKey) {
        const decrypted = this.decrypt(encryptedRecord, patientKey);
        return decrypted ? JSON.parse(decrypted) : null;
    }
}

module.exports = EncryptionService;