const mongoose = require('mongoose');

const encryptionKeySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    publicKey: {
        type: String,
        required: true
    },
    encryptedPrivateKey: {
        type: String,
        required: true
    },
    keyVersion: {
        type: Number,
        default: 1
    },
    lastRotated: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('EncryptionKey', encryptionKeySchema);