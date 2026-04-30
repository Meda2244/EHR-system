const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    doctor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    hospital: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Hospital' 
    },
    date: { 
        type: Date, 
        required: true 
    },
    duration: { 
        type: Number, 
        default: 30 
    },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    reason: { 
        type: String 
    },
    notes: { 
        type: String 
    },
    cancellationReason: { 
        type: String 
    },
    reminderSent: { 
        type: Boolean, 
        default: false 
    },
    rescheduleHistory: [{
        oldDate: Date,
        newDate: Date,
        reason: String,
        requestedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// فهارس لتحسين الأداء
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ patient: 1, status: 1 });
appointmentSchema.index({ hospital: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);