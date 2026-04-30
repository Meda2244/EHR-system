const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    static async generateMedicalReport(report, patient, doctor) {
        return new Promise((resolve, reject) => {
            try {
                // Create PDF directory if not exists
                const pdfDir = path.join(__dirname, '../reports/pdfs');
                if (!fs.existsSync(pdfDir)) {
                    fs.mkdirSync(pdfDir, { recursive: true });
                }

                const filename = `report_${report._id}_${Date.now()}.pdf`;
                const filepath = path.join(pdfDir, filename);
                
                const doc = new PDFDocument({ 
                    margin: 50,
                    size: 'A4'
                });
                
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Header with logo/header
                doc.fontSize(20)
                   .fillColor('#2563eb')
                   .text('EHR System - Medical Report', { align: 'center' })
                   .fillColor('#000000');
                
                doc.moveDown();
                
                // Report metadata
                doc.fontSize(10)
                   .fillColor('#666666')
                   .text(`Report ID: ${report._id}`, { align: 'right' })
                   .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
                   .text(`Time: ${new Date().toLocaleTimeString()}`, { align: 'right' });
                
                doc.moveDown(2);

                // Patient Information
                doc.fontSize(14)
                   .fillColor('#2563eb')
                   .text('Patient Information', { underline: true })
                   .fillColor('#000000');
                
                doc.moveDown(0.5);
                doc.fontSize(12)
                   .text(`Name: ${patient.firstName} ${patient.lastName}`)
                   .text(`Email: ${patient.email}`)
                   .text(`Phone: ${patient.phoneNumber || 'N/A'}`);
                
                doc.moveDown(1.5);

                // Doctor Information
                doc.fontSize(14)
                   .fillColor('#2563eb')
                   .text('Attending Physician', { underline: true })
                   .fillColor('#000000');
                
                doc.moveDown(0.5);
                doc.fontSize(12)
                   .text(`Dr. ${doctor.firstName} ${doctor.lastName}`)
                   .text(`Email: ${doctor.email}`);
                
                doc.moveDown(1.5);

                // Report Details
                doc.fontSize(14)
                   .fillColor('#2563eb')
                   .text('Report Details', { underline: true })
                   .fillColor('#000000');
                
                doc.moveDown(0.5);
                doc.fontSize(12)
                   .text(`Title: ${report.title}`)
                   .text(`Description: ${report.description || 'N/A'}`)
                   .text(`Diagnosis: ${report.diagnosis}`);
                
                doc.moveDown(1.5);

                // Prescriptions
                if (report.prescriptions && report.prescriptions.length > 0) {
                    doc.fontSize(14)
                       .fillColor('#2563eb')
                       .text('Prescriptions', { underline: true })
                       .fillColor('#000000');
                    
                    doc.moveDown(0.5);
                    
                    report.prescriptions.forEach((prescription, index) => {
                        doc.fontSize(12)
                           .text(`${index + 1}. ${prescription.medicine}`)
                           .text(`   Dosage: ${prescription.dosage}`)
                           .text(`   Duration: ${prescription.duration}`);
                        
                        if (index < report.prescriptions.length - 1) {
                            doc.moveDown(0.5);
                        }
                    });
                    
                    doc.moveDown(1.5);
                }

                // Attachments
                if (report.attachments && report.attachments.length > 0) {
                    doc.fontSize(14)
                       .fillColor('#2563eb')
                       .text('Attachments', { underline: true })
                       .fillColor('#000000');
                    
                    doc.moveDown(0.5);
                    doc.fontSize(12);
                    
                    report.attachments.forEach((att, index) => {
                        doc.text(`${index + 1}. ${att.filename}`);
                    });
                    
                    doc.moveDown(1.5);
                }

                // Signature
                doc.moveDown(2);
                
                // Draw a line for signature
                doc.moveTo(50, doc.y)
                   .lineTo(250, doc.y)
                   .stroke();
                
                doc.moveDown(0.5);
                doc.fontSize(12).text('Electronic Signature:', 50, doc.y - 10);
                
                // Add signature image if exists and file exists
                if (report.signature && fs.existsSync(path.join(__dirname, '../', report.signature))) {
                    try {
                        const sigPath = path.join(__dirname, '../', report.signature);
                        doc.image(sigPath, 200, doc.y - 30, { width: 100 });
                    } catch (err) {
                        console.error('Error adding signature image:', err);
                    }
                } else {
                    doc.text('Digitally Signed', 200, doc.y - 10);
                }

                // Footer
                doc.moveDown(3);
                doc.fontSize(9)
                   .fillColor('#666666')
                   .text('This is an electronically generated medical report.', { align: 'center' })
                   .text('EHR System - Electronic Health Record System', { align: 'center' })
                   .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

                // Add page numbers
                const pages = doc.bufferedPageRange();
                for (let i = 0; i < pages.count; i++) {
                    doc.switchToPage(i);
                    doc.fontSize(8)
                       .fillColor('#999999')
                       .text(`Page ${i + 1} of ${pages.count}`, 
                             doc.page.width - 100, 
                             doc.page.height - 50, 
                             { align: 'right' });
                }

                doc.end();

                stream.on('finish', () => {
                    console.log(`✅ PDF generated: ${filename}`);
                    resolve({
                        filename,
                        path: `reports/pdfs/${filename}`
                    });
                });

                stream.on('error', (error) => {
                    console.error('❌ Error in PDF stream:', error);
                    reject(error);
                });

            } catch (error) {
                console.error('❌ Error generating PDF:', error);
                reject(error);
            }
        });
    }

    static async generatePrescription(report, patient, doctor) {
        // Simplified version for quick prescriptions
        return this.generateMedicalReport(report, patient, doctor);
    }
}

module.exports = PDFGenerator;