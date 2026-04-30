const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    targetType: { 
        type: String, 
        enum: ['doctor', 'hospital'], 
        required: true 
    },
    targetId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        required: true 
    },
    comment: { 
        type: String 
    },
    isAnonymous: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// فهرس لتحسين الأداء
reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);