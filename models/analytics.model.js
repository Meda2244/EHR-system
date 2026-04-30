const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    totalUsers: { type: Number, default: 0 },
    totalDoctors: { type: Number, default: 0 },
    totalPatients: { type: Number, default: 0 },
    totalAdmins: { type: Number, default: 0 },
    totalNurses: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    completedAppointments: { type: Number, default: 0 },
    cancelledAppointments: { type: Number, default: 0 },
    pendingAppointments: { type: Number, default: 0 },
    totalReports: { type: Number, default: 0 },
    totalHospitals: { type: Number, default: 0 },
    performanceRates: {
        adminPerformance: { type: Number, default: 91.3 },
        doctorPerformance: { type: Number, default: 87.2 },
        patientSatisfaction: { type: Number, default: 94.5 }
    },
    ministryStats: {
        hospitalsCount: { type: Number, default: 156 },
        doctorsCount: { type: Number, default: 342 },
        patientsCount: { type: Number, default: 12847 },
        occupancyRate: { type: Number, default: 23.3 }
    },
    chartStats: {
        values: [{ type: Number, default: 0 }],
        labels: [{ type: String }]
    },
    dailyStats: [{
        date: { type: Date },
        newUsers: { type: Number, default: 0 },
        newAppointments: { type: Number, default: 0 },
        newReports: { type: Number, default: 0 }
    }],
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);