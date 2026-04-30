const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const loggerEvent = require("../services/logger.service");
const emailService = require("../services/email.service");
const logger = loggerEvent("auth");

const authController = {
    newUser: async (req, res) => {
        try {
           logger.info(req.body);
           
           let data = req.body;
           
           if(!data || !data.email) {
               return res.status(400).send({message: "Email is required"});
           }
           
           let duplicatedEmail = await User.findOne({email: data.email});
           if(duplicatedEmail){
               return res.status(403).send({message: "Email already exists"});
           }

           let newUser = new User(data);
           await newUser.save();
           
           await emailService.sendWelcomeEmail(newUser.email, newUser.firstName);
           
           res.status(201).send({message: "User created successfully"});
           
        } catch (error) {
            logger.error(error.message);
            res.status(500).send({message: error.message});
        }
    },

    login: async (req, res) => {
        try {
           logger.info(req.body);
           
           const {email, password} = req.body;
           
           if(!email || !password) {
               return res.status(400).send({message: "Email and password required"});
           }
           
           const user = await User.findOne({email: email});
           if(!user) return res.status(403).send({message: "invalid email or password"});
              
           const validPassword = await bcrypt.compare(password, user.password);
           if(!validPassword) return res.status(403).send({message: "invalid email or password"});
            
           const token = jwt.sign({email: user.email, id: user._id}, process.env.SECRET_KEY, {expiresIn: "2d"});
           
           res.cookie("access_token", token, {
               httpOnly: true,
               maxAge: 1000 * 60 * 60 * 24 * 2
           });
           
           user.tokens.push(token);
           await user.save();

           res.status(200).send({message: "login successful", token});
           
        } catch (error) {
            logger.error(error.message);
            res.status(500).send({message: error.message});
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "البريد الإلكتروني غير موجود" });
            }

            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            user.resetCode = resetCode;
            user.resetCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            await emailService.sendNotificationEmail(
                email,
                "🔐 كود إعادة تعيين كلمة المرور",
                `
                <h2>كود إعادة تعيين كلمة المرور</h2>
                <p>مرحباً ${user.firstName},</p>
                <p>كودك هو: <strong style="font-size: 24px; color: #007bff;">${resetCode}</strong></p>
                <p>الكود صالح لمدة 10 دقائق فقط</p>
                <p>إذا لم تطلب هذا، تجاهل هذا البريد</p>
                `
            );

            logger.info(`Reset code sent to ${email}`);
            res.status(200).json({ 
                message: "تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني",
                email: email
            });

        } catch (error) {
            logger.error(error.message);
            res.status(500).json({ message: error.message });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { email, code, newPassword, confirmPassword } = req.body;

            if (!email || !code || !newPassword || !confirmPassword) {
                return res.status(400).json({ message: "جميع الحقول مطلوبة" });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ message: "كلمات المرور غير متطابقة" });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
            }

            const user = await User.findOne({
                email,
                resetCode: code,
                resetCodeExpire: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({ message: "الكود غير صحيح أو انتهت صلاحيته" });
            }

            user.password = await bcrypt.hash(newPassword, 10);
            user.resetCode = undefined;
            user.resetCodeExpire = undefined;
            await user.save();

            await emailService.sendNotificationEmail(
                email,
                "✅ تم تغيير كلمة المرور بنجاح",
                `
                <h2>تم تغيير كلمة المرور بنجاح</h2>
                <p>تم تغيير كلمة المرور الخاصة بك بنجاح.</p>
                <p>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
                <p>إذا لم تقم بذلك، يرجى الاتصال بنا.</p>
                `
            );

            logger.info(`Password reset for ${email}`);
            res.status(200).json({ message: "تم تغيير كلمة المرور بنجاح" });

        } catch (error) {
            logger.error(error.message);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = authController;