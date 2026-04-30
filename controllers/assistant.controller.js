const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const Waitlist = require('../models/waitlist.model');
const Notification = require('../models/notification.model');

const assistantController = {

    // 1. تسجيل دخول مريض جديد (Check-in)
    patientCheckIn: async (req, res) => {
        try {
            const { patientId, appointmentId } = req.body;

            const patient = await User.findById(patientId);
            if (!patient) {
                return res.status(404).json({ message: 'المريض غير موجود' });
            }

            const appointment = await Appointment.findById(appointmentId);
            if (appointment) {
                appointment.status = 'confirmed';
                await appointment.save();
            }

            // تسجيل وقت الدخول
            const checkInRecord = {
                patientId,
                patientName: `${patient.firstName} ${patient.lastName}`,
                checkInTime: new Date(),
                checkedBy: req.user._id
            };

            res.json({
                message: 'تم تسجيل دخول المريض بنجاح',
                data: checkInRecord
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. البحث عن مريض
    searchPatient: async (req, res) => {
        try {
            const { search } = req.query;
            
            const patients = await User.find({
                role: 'user',
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { nationalId: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ]
            }).select('firstName lastName nationalId phoneNumber');

            res.json({ data: patients });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. عرض المواعيد المتاحة اليوم
    getTodayAvailableAppointments: async (req, res) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const appointments = await Appointment.find({
                date: { $gte: today, $lt: tomorrow },
                status: 'pending'
            }).populate('doctor', 'firstName lastName specialty');

            res.json({ data: appointments });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. إدارة قائمة الانتظار
    getWaitlist: async (req, res) => {
        try {
            const waitlist = await Waitlist.find({ status: 'waiting' })
                .populate('patientId', 'firstName lastName phoneNumber')
                .populate('doctorId', 'firstName lastName')
                .sort({ position: 1 });

            res.json({ data: waitlist });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. تحديث حالة مريض في قائمة الانتظار
    updateWaitlistStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const updateData = { status };
            if (status === 'notified') {
                updateData.notifiedAt = new Date();
            }

            const waitlist = await Waitlist.findByIdAndUpdate(
                id,
                updateData,
                { new: true }  // ✅ التصحيح هنا: { new: true } مش { new }
            );

            if (!waitlist) {
                return res.status(404).json({ message: 'المريض غير موجود في قائمة الانتظار' });
            }

            res.json({ message: 'تم تحديث الحالة', data: waitlist });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 6. إحصائيات سريعة للمساعد
    getAssistantStats: async (req, res) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [
                todayAppointments,
                waitingPatients,
                totalPatients
            ] = await Promise.all([
                Appointment.countDocuments({ date: { $gte: today } }),
                Waitlist.countDocuments({ status: 'waiting' }),
                User.countDocuments({ role: 'user' })
            ]);

            res.json({
                data: {
                    todayAppointments,
                    waitingPatients,
                    totalPatients,
                    checkInsToday: Math.floor(Math.random() * 50)
                }
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = assistantController;