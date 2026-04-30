const SystemSettings = require('../models/systemSettings.model');

const settingsController = {

    // 1. الحصول على إعدادات النظام
    getSettings: async (req, res) => {
        try {
            let settings = await SystemSettings.findOne();
            
            if (!settings) {
                settings = await SystemSettings.create({});
            }
            
            res.json({ data: settings });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. تحديث إعدادات النظام
    updateSettings: async (req, res) => {
        try {
            const allowedUpdates = [
                'language', 'dateFormat', 'timeFormat', 'fontSize',
                'emailNotifications', 'smsNotifications', 'sessionTimeout',
                'maxLoginAttempts', 'defaultHospitalId'
            ];
            
            let settings = await SystemSettings.findOne();
            
            if (!settings) {
                settings = new SystemSettings();
            }
            
            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    settings[field] = req.body[field];
                }
            });
            
            settings.lastUpdate = new Date();
            await settings.save();
            
            res.json({ message: 'تم تحديث الإعدادات بنجاح', data: settings });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. تحديث اللغة
    updateLanguage: async (req, res) => {
        try {
            const { language } = req.body;
            
            let settings = await SystemSettings.findOne();
            if (!settings) settings = new SystemSettings();
            
            settings.language = language;
            await settings.save();
            
            res.json({ message: 'تم تحديث اللغة', data: settings });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. تحديث إصدار النظام
    updateSystemVersion: async (req, res) => {
        try {
            const { version } = req.body;
            
            let settings = await SystemSettings.findOne();
            if (!settings) settings = new SystemSettings();
            
            settings.systemVersion = version;
            settings.lastUpdate = new Date();
            await settings.save();
            
            res.json({ message: 'تم تحديث الإصدار', data: settings });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = settingsController;