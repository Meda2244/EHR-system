const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

const appointmentController = {

    // 1. حجز موعد جديد
    createAppointment: async (req, res) => {
        try {
            const { doctorId, hospitalId, date, reason } = req.body;

            // التحقق من وجود الدكتور
            const doctor = await User.findById(doctorId);
            if (!doctor || !doctor.role.includes('doctor')) {
                return res.status(404).json({ message: 'الطبيب غير موجود' });
            }

            // التحقق من عدم وجود تعارض في الموعد
            const startTime = new Date(date);
            const endTime = new Date(startTime.getTime() + 30 * 60000);

            const conflicting = await Appointment.findOne({
                doctor: doctorId,
                status: { $in: ['pending', 'confirmed'] },
                date: { $gte: startTime, $lt: endTime }
            });

            if (conflicting) {
                return res.status(409).json({ 
                    message: 'هذا الوقت غير متاح للطبيب',
                    nextAvailable: conflicting.date
                });
            }

            // إنشاء الموعد
            const appointment = new Appointment({
                patient: req.user._id,
                doctor: doctorId,
                hospital: hospitalId,
                date,
                reason,
                status: 'pending'
            });

            await appointment.save();

            // إرسال إشعار للدكتور
            await Notification.create({
                user: doctorId,
                title: 'موعد جديد',
                message: `لديك موعد جديد من المريض ${req.user.firstName} ${req.user.lastName}`,
                type: 'APPOINTMENT',
                meta: { appointmentId: appointment._id }
            });

            res.status(201).json({ 
                message: 'تم حجز الموعد بنجاح، في انتظار تأكيد الطبيب',
                data: appointment 
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. عرض مواعيدي (للمريض)
    getMyAppointments: async (req, res) => {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const query = { patient: req.user._id };
            if (status) query.status = status;

            const appointments = await Appointment.find(query)
                .populate('doctor', 'firstName lastName email specialty')
                .populate('hospital', 'name')
                .sort({ date: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await Appointment.countDocuments(query);

            res.json({
                data: appointments,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. عرض مواعيد الدكتور (للطبيب فقط)
    getDoctorAppointments: async (req, res) => {
        try {
            const { status, date } = req.query;
            const query = { doctor: req.user._id };
            
            if (status) query.status = status;
            
            if (date) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                query.date = { $gte: start, $lt: end };
            }

            const appointments = await Appointment.find(query)
                .populate('patient', 'firstName lastName email phoneNumber')
                .populate('hospital', 'name')
                .sort({ date: 1 });

            res.json({ data: appointments });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. تحديث حالة الموعد (للدكتور فقط)
    updateAppointmentStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            const appointment = await Appointment.findOneAndUpdate(
                { _id: id, doctor: req.user._id },
                { status, notes },
                { new: true }
            ).populate('patient', 'firstName lastName email');

            if (!appointment) {
                return res.status(404).json({ message: 'الموعد غير موجود' });
            }

            // إرسال إشعار للمريض
            let message = '';
            if (status === 'confirmed') message = 'تم تأكيد موعدك';
            else if (status === 'cancelled') message = 'تم إلغاء موعدك';
            else if (status === 'completed') message = 'تم إكمال موعدك';

            await Notification.create({
                user: appointment.patient._id,
                title: 'تحديث حالة الموعد',
                message,
                type: 'APPOINTMENT',
                meta: { appointmentId: appointment._id, status }
            });

            res.json({ 
                message: `تم ${status === 'confirmed' ? 'تأكيد' : status === 'cancelled' ? 'إلغاء' : 'تحديث'} الموعد`,
                data: appointment 
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. إلغاء موعد (للمريض)
    cancelAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const appointment = await Appointment.findOneAndUpdate(
                { _id: id, patient: req.user._id, status: { $in: ['pending', 'confirmed'] } },
                { status: 'cancelled', cancellationReason: reason },
                { new: true }
            ).populate('doctor', 'firstName lastName email');

            if (!appointment) {
                return res.status(404).json({ message: 'الموعد غير موجود أو لا يمكن إلغاؤه' });
            }

            // إشعار للدكتور
            await Notification.create({
                user: appointment.doctor._id,
                title: 'إلغاء موعد',
                message: `تم إلغاء الموعد من قبل المريض`,
                type: 'APPOINTMENT',
                meta: { appointmentId: appointment._id }
            });

            res.json({ message: 'تم إلغاء الموعد بنجاح' });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 6. التحقق من توفر الدكتور
    checkAvailability: async (req, res) => {
        try {
            const { doctorId, date } = req.body;
            
            const startTime = new Date(date);
            const endTime = new Date(startTime.getTime() + 30 * 60000);

            const conflicting = await Appointment.findOne({
                doctor: doctorId,
                status: { $in: ['pending', 'confirmed'] },
                date: { $gte: startTime, $lt: endTime }
            });

            res.json({ 
                available: !conflicting,
                conflictingTime: conflicting ? conflicting.date : null
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = appointmentController;