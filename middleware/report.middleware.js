const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure reports directories exist
const attachmentsDir = path.join(__dirname, '../reports/attachments');
const pdfsDir = path.join(__dirname, '../reports/pdfs');
const signaturesDir = path.join(__dirname, '../signatures');

[attachmentsDir, pdfsDir, signaturesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Configure storage for report attachments
const attachmentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'reports/attachments/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'att-' + uniqueSuffix + ext);
    }
});

// Configure storage for signature images
const signatureStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'signatures/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'sig-' + uniqueSuffix + ext);
    }
});

// File filter for attachments (PDF and images)
const attachmentFileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and images are allowed for attachments'), false);
    }
};

// File filter for signatures (images only)
const signatureFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed for signatures'), false);
    }
};

// Multer instances
const uploadAttachment = multer({
    storage: attachmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: attachmentFileFilter
});

const uploadSignature = multer({
    storage: signatureStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: signatureFileFilter
});

module.exports = {
    uploadAttachment,
    uploadSignature
};