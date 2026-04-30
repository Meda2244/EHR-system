const Hospital = require('../models/hospital.model');
const User = require('../models/user.model');

const hospitalController = {

    // 1. عرض جميع المستشفيات (مع بحث وتصفية)
    getAllHospitals: async (req, res) => {
        try {
            const { governorate, search, page = 1, limit = 10 } = req.query;
            const query = { isActive: true };
            
            if (governorate) query.governorate = governorate;
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { address: { $regex: search, $options: 'i' } }
                ];
            }

            const hospitals = await Hospital.find(query)
                .sort({ rating: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await Hospital.countDocuments(query);

            res.json({
                data: hospitals,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. عرض مستشفى معين
    getHospitalById: async (req, res) => {
        try {
            const hospital = await Hospital.findById(req.params.id);
            if (!hospital) {
                return res.status(404).json({ message: 'المستشفى غير موجود' });
            }

            // جلب الأطباء العاملين في المستشفى
            const doctors = await User.find({ 
                hospitalId: hospital._id, 
                role: 'doctor',
                isActive: true 
            }).select('firstName lastName email specialty rating');

            // جلب عدد المرضى
            const patientsCount = await User.countDocuments({ 
                hospitalId: hospital._id, 
                role: 'user',
                isActive: true 
            });

            // جلب عدد الممرضين
            const nursesCount = await User.countDocuments({ 
                hospitalId: hospital._id, 
                role: 'nurse',
                isActive: true 
            });

            res.json({ 
                hospital, 
                doctors,
                stats: {
                    doctorsCount: doctors.length,
                    patientsCount,
                    nursesCount
                },
                averageRating: hospital.rating,
                totalReviews: hospital.ratingCount
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. إنشاء مستشفى جديد (للمسؤول فقط)
    createHospital: async (req, res) => {
        try {
            const hospital = new Hospital(req.body);
            await hospital.save();

            res.status(201).json({ 
                message: 'تم إضافة المستشفى بنجاح', 
                data: hospital 
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. تحديث بيانات مستشفى
    updateHospital: async (req, res) => {
        try {
            const hospital = await Hospital.findByIdAndUpdate(
                req.params.id, 
                req.body, 
                { new: true, runValidators: true }
            );

            if (!hospital) {
                return res.status(404).json({ message: 'المستشفى غير موجود' });
            }

            res.json({ 
                message: 'تم تحديث المستشفى بنجاح', 
                data: hospital 
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. حذف مستشفى
    deleteHospital: async (req, res) => {
        try {
            const hospital = await Hospital.findByIdAndDelete(req.params.id);
            if (!hospital) {
                return res.status(404).json({ message: 'المستشفى غير موجود' });
            }

            // تحديث المستخدمين المرتبطين بهذا المستشفى
            await User.updateMany(
                { hospitalId: req.params.id },
                { $unset: { hospitalId: "" } }
            );

            res.json({ message: 'تم حذف المستشفى بنجاح' });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 6. إحصائيات المستشفى
    getHospitalStats: async (req, res) => {
        try {
            const hospital = await Hospital.findById(req.params.id);
            if (!hospital) {
                return res.status(404).json({ message: 'المستشفى غير موجود' });
            }

            const doctorsCount = await User.countDocuments({ 
                hospitalId: hospital._id, 
                role: 'doctor' 
            });
            
            const patientsCount = await User.countDocuments({ 
                hospitalId: hospital._id, 
                role: 'user' 
            });

            const nursesCount = await User.countDocuments({ 
                hospitalId: hospital._id, 
                role: 'nurse' 
            });

            res.json({
                hospitalId: hospital._id,
                name: hospital.name,
                doctorsCount,
                patientsCount,
                nursesCount,
                totalAppointments: hospital.totalAppointments || 0,
                rating: hospital.rating,
                ratingCount: hospital.ratingCount
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 7. جلب المحافظات (للفلترة)
    getGovernorates: async (req, res) => {
        try {
            const governorates = await Hospital.distinct('governorate', { isActive: true });
            res.json({ data: governorates.filter(g => g) });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 8. تحديث تقييم المستشفى
    updateHospitalRating: async (hospitalId, newRating) => {
        try {
            const hospital = await Hospital.findById(hospitalId);
            if (!hospital) return;

            const newAverage = (hospital.rating * hospital.ratingCount + newRating) / (hospital.ratingCount + 1);
            
            hospital.rating = Math.round(newAverage * 10) / 10;
            hospital.ratingCount += 1;
            
            await hospital.save();
        } catch (error) {
            console.error('Error updating hospital rating:', error);
        }
    }
};

module.exports = hospitalController;