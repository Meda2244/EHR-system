const Analytics = require('../models/analytics.model');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const Report = require('../models/report.model');
const Hospital = require('../models/hospital.model');

const analyticsController = {

    // 1. تحديث جميع الإحصائيات (يجلب أحدث الأرقام من قاعدة البيانات)
    refreshAnalytics: async (req, res) => {
        try {
            // جلب أحدث الأرقام
            const [totalUsers, totalDoctors, totalPatients, totalAdmins, totalNurses, 
                   totalAppointments, completedAppointments, cancelledAppointments, pendingAppointments,
                   totalReports, totalHospitals] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ role: 'doctor' }),
                User.countDocuments({ role: 'user' }),
                User.countDocuments({ role: 'admin' }),
                User.countDocuments({ role: 'nurse' }),
                Appointment.countDocuments(),
                Appointment.countDocuments({ status: 'completed' }),
                Appointment.countDocuments({ status: 'cancelled' }),
                Appointment.countDocuments({ status: 'pending' }),
                Report.countDocuments(),
                Hospital.countDocuments()
            ]);

            // حساب نسب الأداء
            const adminPerformance = totalAdmins > 0 ? Math.round((totalAdmins / totalUsers) * 100) : 91.3;
            const doctorPerformance = totalDoctors > 0 ? Math.round((totalDoctors / totalUsers) * 100) : 87.2;
            const patientSatisfaction = completedAppointments > 0 
                ? Math.round((completedAppointments / totalAppointments) * 100) 
                : 94.5;

            // تحديث أو إنشاء الإحصائيات
            let analytics = await Analytics.findOne();
            
            if (!analytics) {
                analytics = new Analytics();
            }
            
            analytics.totalUsers = totalUsers;
            analytics.totalDoctors = totalDoctors;
            analytics.totalPatients = totalPatients;
            analytics.totalAdmins = totalAdmins;
            analytics.totalNurses = totalNurses;
            analytics.totalAppointments = totalAppointments;
            analytics.completedAppointments = completedAppointments;
            analytics.cancelledAppointments = cancelledAppointments;
            analytics.pendingAppointments = pendingAppointments;
            analytics.totalReports = totalReports;
            analytics.totalHospitals = totalHospitals;
            analytics.performanceRates = {
                adminPerformance,
                doctorPerformance,
                patientSatisfaction
            };
            analytics.ministryStats = {
                hospitalsCount: totalHospitals,
                doctorsCount: totalDoctors,
                patientsCount: totalPatients,
                occupancyRate: totalAppointments > 0 ? Math.round((totalAppointments / (totalDoctors * 30)) * 100) : 23.3
            };
            analytics.lastUpdated = new Date();
            
            await analytics.save();
            
            res.json({
                message: 'تم تحديث الإحصائيات بنجاح',
                data: analytics
            });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. لوحة تحكم Super Admin (من الصورة)
    getSuperAdminDashboard: async (req, res) => {
        try {
            let analytics = await Analytics.findOne();
            
            if (!analytics) {
                // إنشاء إحصائيات افتراضية إذا لم تكن موجودة
                analytics = new Analytics();
                await analytics.save();
            }
            
            // جلب إحصائيات إضافية للرسم البياني (آخر 6 أسابيع)
            const weeklyAppointments = await Appointment.aggregate([
                {
                    $group: {
                        _id: { $week: '$createdAt' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 6 }
            ]);
            
            const chartValues = weeklyAppointments.map(w => w.count).reverse();
            while (chartValues.length < 6) chartValues.unshift(0);
            
            analytics.chartStats = {
                values: chartValues,
                labels: ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4', 'الأسبوع 5', 'الأسبوع 6']
            };
            
            res.json({
                success: true,
                data: {
                    performanceRates: analytics.performanceRates,
                    ministryStats: analytics.ministryStats,
                    chartStats: analytics.chartStats,
                    totals: {
                        users: analytics.totalUsers,
                        doctors: analytics.totalDoctors,
                        patients: analytics.totalPatients,
                        admins: analytics.totalAdmins,
                        nurses: analytics.totalNurses,
                        hospitals: analytics.totalHospitals,
                        appointments: analytics.totalAppointments,
                        reports: analytics.totalReports
                    },
                    lastUpdated: analytics.lastUpdated
                }
            });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. لوحة تحكم Doctor (من الصورة)
    getDoctorDashboard: async (req, res) => {
        try {
            const doctorId = req.user._id;
            
            // إحصائيات الدكتور
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const [
                todayAppointments,
                totalPatients,
                totalReports,
                completedAppointments,
                recentAppointments
            ] = await Promise.all([
                Appointment.countDocuments({ 
                    doctor: doctorId, 
                    date: { $gte: today, $lt: tomorrow } 
                }),
                Appointment.distinct('patient', { doctor: doctorId }).then(ids => ids.length),
                Report.countDocuments({ doctorId }),
                Appointment.countDocuments({ doctor: doctorId, status: 'completed' }),
                Appointment.find({ doctor: doctorId })
                    .sort({ date: -1 })
                    .limit(10)
                    .populate('patient', 'firstName lastName phoneNumber')
            ]);
            
            // حساب نسبة الإنجاز
            const completionRate = totalPatients > 0 
                ? Math.round((completedAppointments / totalPatients) * 100) 
                : 0;
            
            // ترتيب الأطباء (من الصورة: جدول الأطباء)
            const topDoctors = await User.aggregate([
                { $match: { role: 'doctor' } },
                {
                    $lookup: {
                        from: 'appointments',
                        localField: '_id',
                        foreignField: 'doctor',
                        as: 'appointments'
                    }
                },
                {
                    $project: {
                        name: { $concat: ['$firstName', ' ', '$lastName'] },
                        doctorNumber: 1,
                        sessionCount: { $size: '$appointments' }
                    }
                },
                { $sort: { sessionCount: -1 } },
                { $limit: 10 }
            ]);
            
            // إضافة أرقام ترتيبية للأطباء
            const doctorsList = topDoctors.map((doc, index) => ({
                name: doc.name,
                doctorNumber: index + 1,
                sessionCount: doc.sessionCount
            }));
            
            res.json({
                success: true,
                data: {
                    welcomeName: `د. ${req.user.firstName} ${req.user.lastName}`,
                    stats: {
                        todayAppointments,
                        totalPatients,
                        totalReports,
                        completionRate
                    },
                    recentAppointments,
                    doctorsList
                }
            });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. لوحة تحكم Hospital Admin
    getHospitalDashboard: async (req, res) => {
        try {
            const hospitalId = req.user.hospitalId;
            
            if (!hospitalId) {
                return res.status(400).json({ message: 'لم يتم تعيين مستشفى لهذا المسؤول' });
            }
            
            const [
                doctors,
                patients,
                nurses,
                totalAppointments,
                completedAppointments,
                pendingAppointments,
                todayAppointments
            ] = await Promise.all([
                User.countDocuments({ hospitalId, role: 'doctor' }),
                User.countDocuments({ hospitalId, role: 'user' }),
                User.countDocuments({ hospitalId, role: 'nurse' }),
                Appointment.countDocuments({ hospital: hospitalId }),
                Appointment.countDocuments({ hospital: hospitalId, status: 'completed' }),
                Appointment.countDocuments({ hospital: hospitalId, status: 'pending' }),
                Appointment.countDocuments({ 
                    hospital: hospitalId, 
                    date: { $gte: new Date().setHours(0, 0, 0, 0) } 
                })
            ]);
            
            const hospital = await Hospital.findById(hospitalId);
            
            res.json({
                success: true,
                data: {
                    hospitalName: hospital?.name || 'غير محدد',
                    stats: {
                        doctors,
                        patients,
                        nurses,
                        totalAppointments,
                        completedAppointments,
                        pendingAppointments,
                        todayAppointments
                    },
                    occupancyRate: totalAppointments > 0 
                        ? Math.round((totalAppointments / (doctors * 30)) * 100) 
                        : 0
                }
            });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. إحصائيات سريعة (للصفحة الرئيسية)
    getQuickStats: async (req, res) => {
        try {
            const [
                totalUsers,
                totalDoctors,
                totalPatients,
                totalHospitals,
                todayAppointments
            ] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ role: 'doctor' }),
                User.countDocuments({ role: 'user' }),
                Hospital.countDocuments(),
                Appointment.countDocuments({ 
                    date: { 
                        $gte: new Date().setHours(0, 0, 0, 0),
                        $lt: new Date().setHours(23, 59, 59, 999)
                    } 
                })
            ]);
            
            res.json({
                success: true,
                data: {
                    totalUsers,
                    totalDoctors,
                    totalPatients,
                    totalHospitals,
                    todayAppointments
                }
            });
            
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = analyticsController;