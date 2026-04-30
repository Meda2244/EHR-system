const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const { boolean } = require("joi")

const Schema = mongoose.Schema

const userSchema = new Schema({
    firstName: { 
        type: String,
        trim : true,
        required: true,
    },
    lastName: {
        type: String,
        trim : true,
        required: true,
    },
    image : {
        type : String,
        trim : true,
    },
    email: {
        type: String,
        trim : true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        trim : true,
        required: true,
        minlength: 6,
    },
    nationalId:{
        type: Number,
        trim : true,
        required: true,
        unique: true,
    },
    phoneNumber: {
        type: Number,
        trim : true,
        required: true,
        unique: true,
    },
    birthDate:{
        type: String,
        required: true,
    },
    role:[{
        type : String,
        enum : ["user", "nurse", "doctor" ,  "admin"],
        default : "user",
        trim : true
    }],
    tokens : [
        {
            type : String,
            trim : true
        }
    ],
    // 🔐 حقول إعادة تعيين كلمة المرور
    resetCode: {
        type: String,
        default: null
    },
    resetCodeExpire: {
        type: Date,
        default: null
    }
                
})

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10)

})

const User = mongoose.model('User', userSchema)
module.exports = User