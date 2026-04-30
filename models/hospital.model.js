const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    address: { 
        type: String,
        trim: true
    },
    governorate: { 
        type: String,
        trim: true
    },
    district: { 
        type: String,
        trim: true
    },
    phone: { 
        type: String,
        trim: true
    },
    email: { 
        type: String,
        trim: true,
        lowercase: true
    },
    rating: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 5 
    },
    ratingCount: { 
        type: Number, 
        default: 0 
    },
    image: { 
        type: String,
        trim: true
    },
    description: { 
        type: String,
        trim: true
    },
    departments: [{ 
        type: String 
    }],
    workingHours: {
        open: { type: String, default: "08:00" },
        close: { type: String, default: "20:00" }
    },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    // المسؤولون
    superAdminId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    centerAdminId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    // إحصائيات
    totalPatients: { 
        type: Number, 
        default: 0 
    },
    totalDoctors: { 
        type: Number, 
        default: 0 
    },
    totalAppointments: { 
        type: Number, 
        default: 0 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

// فهرس للبحث
hospitalSchema.index({ name: 1, governorate: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);