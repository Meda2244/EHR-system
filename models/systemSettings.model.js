const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    language: {
        type: String,
        enum: ['ar', 'en', 'fr', 'es', 'zh', 'ja'],
        default: 'ar'
    },
    dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD'],
        default: 'DD/MM/YYYY'
    },
    timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '24h'
    },
    fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
    },
    systemVersion: {
        type: String,
        default: '1.0.0'
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    },
    isBackupEnabled: {
        type: Boolean,
        default: false
    },
    backupTime: {
        type: String,
        default: '00:00'
    },
    emailNotifications: {
        type: Boolean,
        default: true
    },
    smsNotifications: {
        type: Boolean,
        default: false
    },
    sessionTimeout: {
        type: Number,
        default: 120
    },
    maxLoginAttempts: {
        type: Number,
        default: 5
    },
    defaultHospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);