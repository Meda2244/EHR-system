const Waitlist = require('../models/waitlist.model');
const Hospital = require('../models/hospital.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const Appointment = require('../models/appointment.model');

const waitlistController = {

    // 1. إضافة مريض إلى قائمة الانتظار
    addToWaitlist: async (req, res) => {
        try {
            const { hospitalId, doctorId, requestedDate, notes } = req.body;

            // التحقق من وجود المستشفى
            const hospital = await Hospital.findById(hospitalId);
            if (!hospital) {
                return res.status(404).json({ message: 'المستشفى غير موجود' });
            }

            // حساب المركز في قائمة الانتظار
            const waitingCount = await Waitlist.countDocuments({
                hospitalId,
                status: 'waiting'
            });

            const waitlist = new Waitlist({
                hospitalId,
                doctorId,
                patientId: req.user._id,
                patientName: `${req.user.firstName} ${req.user.lastName}`,
                patientPhone: req.user.phoneNumber,
                requestedDate,
                notes,
                status: 'waiting',
                position: waitingCount + 1
            });

            await waitlist.save();

            // إشعار للمسؤولين
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                await Notification.create({
                    user: admin._id,
                    title: 'مريض جديد في قائمة الانتظار',
                    message: `المريض ${waitlist.patientName} تم إضافته إلى قائمة الانتظار في ${hospital.name}`,
                    type: 'GENERAL',
                    meta: { waitlistId: waitlist._id }
                });
            }

            res.status(201).json({
                message: 'تم إضافة المريض إلى قائمة الانتظار',
                data: waitlist
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. عرض قائمة الانتظار لمستشفى معين
    getHospitalWaitlist: async (req, res) => {
        try {
            const { hospitalId } = req.params;
            const { status = 'waiting' } = req.query;

            const waitlist = await Waitlist.find({
                hospitalId,
                status
            })
            .populate('patientId', 'firstName lastName email')
            .populate('doctorId', 'firstName lastName specialty')
            .sort({ position: 1, createdAt: 1 });

            res.json({
                data: waitlist,
                count: waitlist.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. عرض قائمة انتظار طبيب معين
    getDoctorWaitlist: async (req, res) => {
        try {
            const { doctorId } = req.params;

            const waitlist = await Waitlist.find({
                doctorId,
                status: 'waiting'
            })
            .populate('patientId', 'firstName lastName email phoneNumber')
            .sort({ position: 1, createdAt: 1 });

            res.json({
                data: waitlist,
                count: waitlist.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. تحديث حالة مريض في قائمة الانتظار
    updateWaitlistStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, scheduledAppointmentId, notes } = req.body;

            const waitlist = await Waitlist.findById(id);
            if (!waitlist) {
                return res.status(404).json({ message: 'المريض غير موجود في قائمة الانتظار' });
            }

            waitlist.status = status;
            if (scheduledAppointmentId) waitlist.scheduledAppointmentId = scheduledAppointmentId;
            if (notes) waitlist.notes = notes;
            if (status === 'notified') waitlist.notifiedAt = new Date();

            await waitlist.save();

            // إشعار للمريض
            let notificationMessage = '';
            if (status === 'notified') {
                notificationMessage = 'موعدك أصبح متاحاً، يرجى تأكيد الحجز';
            } else if (status === 'scheduled') {
                notificationMessage = 'تم حجز موعدك بنجاح';
            } else if (status === 'cancelled') {
                notificationMessage = 'تم إلغاء طلبك من قائمة الانتظار';
            }

            await Notification.create({
                user: waitlist.patientId,
                title: 'تحديث في قائمة الانتظار',
                message: notificationMessage,
                type: 'APPOINTMENT',
                meta: { waitlistId: waitlist._id }
            });

            res.json({
                message: 'تم تحديث حالة المريض',
                data: waitlist
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. إزالة مريض من قائمة الانتظار
    removeFromWaitlist: async (req, res) => {
        try {
            const { id } = req.params;

            const waitlist = await Waitlist.findByIdAndDelete(id);
            if (!waitlist) {
                return res.status(404).json({ message: 'المريض غير موجود في قائمة الانتظار' });
            }

            // إعادة ترتيب المراكز
            await Waitlist.updateMany(
                { hospitalId: waitlist.hospitalId, status: 'waiting', position: { $gt: waitlist.position } },
                { $inc: { position: -1 } }
            );

            res.json({ message: 'تم إزالة المريض من قائمة الانتظار' });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 6. إحصائيات قائمة الانتظار
    getWaitlistStats: async (req, res) => {
        try {
            const { hospitalId } = req.params;

            const waiting = await Waitlist.countDocuments({ hospitalId, status: 'waiting' });
            const notified = await Waitlist.countDocuments({ hospitalId, status: 'notified' });
            const scheduled = await Waitlist.countDocuments({ hospitalId, status: 'scheduled' });
            const cancelled = await Waitlist.countDocuments({ hospitalId, status: 'cancelled' });

            const averageWaitTime = await Waitlist.aggregate([
                { $match: { hospitalId: new mongoose.Types.ObjectId(hospitalId), status: 'scheduled' } },
                { $project: { waitTime: { $subtract: ['$updatedAt', '$createdAt'] } } },
                { $group: { _id: null, avgWaitTime: { $avg: '$waitTime' } } }
            ]);

            res.json({
                stats: {
                    waiting,
                    notified,
                    scheduled,
                    cancelled,
                    total: waiting + notified + scheduled + cancelled
                },
                averageWaitTimeMinutes: averageWaitTime[0] ? Math.round(averageWaitTime[0].avgWaitTime / 60000) : 0
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 7. إشعار أول مريض في قائمة الانتظار
    notifyNextPatient: async (req, res) => {
        try {
            const { hospitalId } = req.params;

            const nextPatient = await Waitlist.findOne({
                hospitalId,
                status: 'waiting'
            }).sort({ position: 1 });

            if (!nextPatient) {
                return res.status(404).json({ message: 'لا يوجد مرضى في قائمة الانتظار' });
            }

            nextPatient.status = 'notified';
            nextPatient.notifiedAt = new Date();
            await nextPatient.save();

            // إشعار للمريض
            await Notification.create({
                user: nextPatient.patientId,
                title: 'موعدك متاح الآن',
                message: 'تم فتح موعد لك، يرجى تأكيد الحجز خلال 24 ساعة',
                type: 'APPOINTMENT',
                meta: { waitlistId: nextPatient._id }
            });

            res.json({
                message: 'تم إشعار المريض التالي',
                data: nextPatient
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = waitlistController;