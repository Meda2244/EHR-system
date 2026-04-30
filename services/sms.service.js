// ملاحظة: هذه خدمة وهمية حالياً
// للإنتاج، قم بتفعيل Twilio أو أي خدمة SMS أخرى

class SMSService {
    
    // إرسال كود التحقق
    static async sendVerificationCode(phoneNumber, code) {
        console.log(`📱 [SMS] إلى ${phoneNumber}: كود التحقق الخاص بك هو ${code}`);
        console.log(`⚠️ ملاحظة: هذه رسالة تجريبية. قم بتفعيل خدمة SMS حقيقية للإنتاج`);
        
        // TODO: تفعيل مع Twilio
        // const accountSid = process.env.TWILIO_ACCOUNT_SID;
        // const authToken = process.env.TWILIO_AUTH_TOKEN;
        // const client = require('twilio')(accountSid, authToken);
        // await client.messages.create({
        //     body: `كود التحقق الخاص بك هو: ${code}`,
        //     to: phoneNumber,
        //     from: process.env.TWILIO_PHONE_NUMBER
        // });
        
        return true;
    }

    // إرسال تذكير موعد
    static async sendAppointmentReminder(phoneNumber, patientName, doctorName, date) {
        const formattedDate = new Date(date).toLocaleString('ar-EG');
        console.log(`📱 [SMS] تذكير لـ ${phoneNumber}: عزيزي ${patientName}، تذكير بموعدك مع د. ${doctorName} في ${formattedDate}`);
        return true;
    }

    // إشعار بتقرير طبي جديد
    static async sendNewReportNotification(phoneNumber, patientName, doctorName, reportTitle) {
        console.log(`📱 [SMS] إلى ${phoneNumber}: عزيزي ${patientName}، تم إضافة تقرير طبي جديد من د. ${doctorName}: ${reportTitle}`);
        return true;
    }
}

module.exports = SMSService;