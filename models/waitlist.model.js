const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
    hospitalId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Hospital', 
        required: true 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    patientName: { 
        type: String, 
        required: true 
    },
    patientPhone: { 
        type: String, 
        required: true 
    },
    requestedDate: { 
        type: Date 
    },
    status: { 
        type: String, 
        enum: ['waiting', 'notified', 'scheduled', 'cancelled'],
        default: 'waiting'
    },
    position: { 
        type: Number 
    },
    notes: { 
        type: String 
    },
    notifiedAt: { 
        type: Date 
    },
    scheduledAppointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Appointment' 
    }
}, { timestamps: true });

// فهارس لتحسين الأداء
waitlistSchema.index({ hospitalId: 1, status: 1, position: 1 });
waitlistSchema.index({ doctorId: 1, status: 1 });
waitlistSchema.index({ patientId: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);