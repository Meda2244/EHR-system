const loggerEvent = require("../services/logger.service");
const logger = loggerEvent("auth");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

const userController = {
  deleteUser: async (req, res) => {
    try {
      logger.info(req.params);
      const { id } = req.params;

      const userDelete = await User.findByIdAndDelete(id);

      if (!userDelete) {
        return res.status(404).send({ message: "User not found" });
      }

      return res.send({ message: "User deleted successfully" });
    } catch (error) {
      logger.error(error.message);
      return res.status(500).send({ message: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      // ما نسمحش للمستخدم يغير role/tokens/password... إلخ
      const allowedUpdates = ["firstName", "lastName", "email", "phoneNumber", "birthDate", "nationalId"];
      let updates = {};

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // اسم الحقل في الموديل عندك: image
      if (req.file) {
        updates.image = `uploads/${req.file.filename}`;
      }

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
        .select("-password -tokens");

      return res.status(200).send(user);
    } catch (error) {
      logger.error(error.message);
      return res.status(500).send({ message: error.message });
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword, rePassword } = req.body;

      if (newPassword !== rePassword) {
        return res.status(400).send({ message: "New password and confirm password do not match" });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      const validPassword = await bcrypt.compare(oldPassword, user.password);
      if (!validPassword) {
        return res.status(403).send({ message: "Invalid old password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });

      return res.status(200).send({ message: "Password updated successfully" });
    } catch (error) {
      logger.error(error.message);
      return res.status(500).send({ message: error.message });
    }
  },

  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("-password -tokens");

      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      return res.status(200).send(user);
    } catch (error) {
      logger.error(error.message);
      return res.status(500).send({ message: error.message });
    }
  },

  getAllUser: async (req, res) => {
    try {
      const users = await User.find({}).select("-password -tokens");

      if (!users || users.length === 0) {
        return res.status(404).send({ message: "No users found" });
      }

      return res.status(200).send(users);
    } catch (error) {
      logger.error(error.message);
      return res.status(500).send({ message: error.message });
    }
  },
};

module.exports = userController;