const Report = require('../models/report.model');
const User = require('../models/user.model');
const PDFGenerator = require('../services/pdfGenerator.service');
const Notification = require('../models/notification.model');
const fs = require('fs');
const path = require('path');

const reportController = {
    // Create new report (doctor only)
    createReport: async (req, res) => {
        try {
            const { patientId, title, description, diagnosis, prescriptions, signature } = req.body;
            
            console.log('📝 Creating report for patient:', patientId);
            
            // Check if patient exists
            const patient = await User.findById(patientId);
            if (!patient) {
                return res.status(404).json({ message: 'Patient not found' });
            }

            // Check if doctor exists
            const doctor = await User.findById(req.user._id);
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor not found' });
            }

            // Parse prescriptions if sent as string
            let parsedPrescriptions = prescriptions;
            if (typeof prescriptions === 'string') {
                try {
                    parsedPrescriptions = JSON.parse(prescriptions);
                } catch (e) {
                    parsedPrescriptions = [];
                }
            }

            // Create report
            const report = new Report({
                patientId,
                doctorId: req.user._id,
                title,
                description,
                diagnosis,
                prescriptions: parsedPrescriptions || [],
                signature: signature || '',
                status: 'draft'
            });

            await report.save();
            console.log('✅ Report saved with ID:', report._id);

            // Generate PDF
            try {
                const pdfResult = await PDFGenerator.generateMedicalReport(report, patient, doctor);
                
                report.pdfFile = pdfResult;
                report.status = 'signed';
                await report.save();
                
                console.log('✅ PDF generated:', pdfResult.filename);
            } catch (pdfError) {
                console.error('❌ PDF generation error:', pdfError);
                // Continue without PDF
            }

            // Send notification to patient
            await Notification.create({
                user: patientId,
                title: 'New Medical Report',
                message: `Dr. ${doctor.firstName} ${doctor.lastName} created a new medical report for you`,
                type: 'GENERAL',
                meta: { 
                    reportId: report._id,
                    reportTitle: title
                }
            });

            return res.status(201).json({
                message: 'Report created successfully',
                report
            });

        } catch (error) {
            console.error('❌ Error in createReport:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Upload attachment to report
    uploadAttachment: async (req, res) => {
        try {
            const { reportId } = req.params;
            
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            console.log('📎 Uploading attachment to report:', reportId);
            console.log('File:', req.file);

            const report = await Report.findOne({
                _id: reportId,
                doctorId: req.user._id
            });

            if (!report) {
                // Delete uploaded file if report not found
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ message: 'Report not found' });
            }

            report.attachments.push({
                filename: req.file.originalname,
                path: req.file.path.replace(/\\/g, '/')
            });

            await report.save();

            return res.status(200).json({
                message: 'Attachment uploaded successfully',
                attachments: report.attachments
            });

        } catch (error) {
            console.error('❌ Error in uploadAttachment:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Upload signature for report
    uploadSignature: async (req, res) => {
        try {
            const { reportId } = req.params;
            
            if (!req.file) {
                return res.status(400).json({ message: 'No signature file uploaded' });
            }

            console.log('✍️ Uploading signature for report:', reportId);

            const report = await Report.findOne({
                _id: reportId,
                doctorId: req.user._id
            });

            if (!report) {
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ message: 'Report not found' });
            }

            // Delete old signature if exists
            if (report.signature) {
                const oldSigPath = path.join(__dirname, '../', report.signature);
                if (fs.existsSync(oldSigPath)) {
                    fs.unlinkSync(oldSigPath);
                }
            }

            report.signature = req.file.path.replace(/\\/g, '/');
            await report.save();

            return res.status(200).json({
                message: 'Signature uploaded successfully',
                signature: report.signature
            });

        } catch (error) {
            console.error('❌ Error in uploadSignature:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Share report with patient/other doctors
    shareReport: async (req, res) => {
        try {
            const { reportId } = req.params;
            const { shareWith } = req.body; // array of user IDs

            console.log('📤 Sharing report:', reportId);
            console.log('Sharing with:', shareWith);

            const report = await Report.findOne({
                _id: reportId,
                doctorId: req.user._id
            });

            if (!report) {
                return res.status(404).json({ message: 'Report not found' });
            }

            // Get doctor info for notification
            const doctor = await User.findById(req.user._id);

            // Add users to sharedWith array
            report.sharedWith = [...new Set([...report.sharedWith, ...shareWith])];
            report.status = 'shared';
            await report.save();

            // Send notifications
            for (const userId of shareWith) {
                const user = await User.findById(userId);
                if (user) {
                    await Notification.create({
                        user: userId,
                        title: 'Medical Report Shared',
                        message: `Dr. ${doctor.firstName} ${doctor.lastName} shared a medical report with you: ${report.title}`,
                        type: 'GENERAL',
                        meta: { 
                            reportId: report._id,
                            reportTitle: report.title
                        }
                    });
                }
            }

            return res.status(200).json({
                message: 'Report shared successfully',
                report
            });

        } catch (error) {
            console.error('❌ Error in shareReport:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Get reports for current user (as patient, doctor, or shared)
    getMyReports: async (req, res) => {
        try {
            console.log('📋 Fetching reports for user:', req.user._id);

            const reports = await Report.find({
                $or: [
                    { patientId: req.user._id },
                    { doctorId: req.user._id },
                    { sharedWith: req.user._id }
                ]
            })
            .populate('doctorId', 'firstName lastName email')
            .populate('patientId', 'firstName lastName email')
            .populate('sharedWith', 'firstName lastName email')
            .sort({ createdAt: -1 });

            console.log(`✅ Found ${reports.length} reports`);

            return res.status(200).json({ 
                count: reports.length,
                data: reports 
            });

        } catch (error) {
            console.error('❌ Error in getMyReports:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Get single report
    getReport: async (req, res) => {
        try {
            const { reportId } = req.params;

            console.log('📖 Fetching report:', reportId);

            const report = await Report.findOne({
                _id: reportId,
                $or: [
                    { patientId: req.user._id },
                    { doctorId: req.user._id },
                    { sharedWith: req.user._id }
                ]
            })
            .populate('doctorId', 'firstName lastName email')
            .populate('patientId', 'firstName lastName email phoneNumber birthDate')
            .populate('sharedWith', 'firstName lastName email');

            if (!report) {
                return res.status(404).json({ message: 'Report not found or access denied' });
            }

            return res.status(200).json({ data: report });

        } catch (error) {
            console.error('❌ Error in getReport:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Download report PDF
    downloadReport: async (req, res) => {
        try {
            const { reportId } = req.params;

            console.log('📥 Downloading report PDF:', reportId);

            const report = await Report.findOne({
                _id: reportId,
                $or: [
                    { patientId: req.user._id },
                    { doctorId: req.user._id },
                    { sharedWith: req.user._id }
                ]
            });

            if (!report) {
                return res.status(404).json({ message: 'Report not found or access denied' });
            }

            if (!report.pdfFile || !report.pdfFile.path) {
                return res.status(404).json({ message: 'PDF file not found for this report' });
            }

            const pdfPath = path.join(__dirname, '../', report.pdfFile.path);
            
            if (!fs.existsSync(pdfPath)) {
                return res.status(404).json({ message: 'PDF file not found on server' });
            }

            res.download(pdfPath, `medical_report_${reportId}.pdf`);

        } catch (error) {
            console.error('❌ Error in downloadReport:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Delete report (doctor only)
    deleteReport: async (req, res) => {
        try {
            const { reportId } = req.params;

            console.log('🗑️ Deleting report:', reportId);

            const report = await Report.findOne({
                _id: reportId,
                doctorId: req.user._id
            });

            if (!report) {
                return res.status(404).json({ message: 'Report not found' });
            }

            // Delete associated files
            if (report.pdfFile && report.pdfFile.path) {
                const pdfPath = path.join(__dirname, '../', report.pdfFile.path);
                if (fs.existsSync(pdfPath)) {
                    fs.unlinkSync(pdfPath);
                }
            }

            if (report.signature) {
                const sigPath = path.join(__dirname, '../', report.signature);
                if (fs.existsSync(sigPath)) {
                    fs.unlinkSync(sigPath);
                }
            }

            report.attachments.forEach(att => {
                if (att.path) {
                    const attPath = path.join(__dirname, '../', att.path);
                    if (fs.existsSync(attPath)) {
                        fs.unlinkSync(attPath);
                    }
                }
            });

            await Report.deleteOne({ _id: reportId });

            return res.status(200).json({ message: 'Report deleted successfully' });

        } catch (error) {
            console.error('❌ Error in deleteReport:', error);
            return res.status(500).json({ message: error.message });
        }
    }
};

module.exports = reportController;