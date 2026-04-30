const User = require("../models/user.model");
const UserData = require("../models/userData.model");
const Notification = require("../models/notification.model");

// POST /api/admin/users/:userId/data
// form-data: text, image (multiple)
exports.addUserDataByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "text is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // because we used upload.fields in route
    const files = Array.isArray(req.files) ? req.files : [];
    const images = files.map(f => f.path.replace(/\\/g, "/"));

    const userData = await UserData.create({
      user: user._id,
      addedBy: req.user._id, // set by authentication middleware
      text: text.trim(),
      images,
    });

    await Notification.create({
      user: user._id,
      title: "New data added",
      message: "Admin added new data to your profile.",
      type: "USER_DATA_ADDED",
      meta: { userDataId: userData._id },
    });

    return res.status(201).json({
      message: "User data added successfully",
      data: userData,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/users/:userId/promote
// body: { role: "doctor" | "nurse" }
exports.promoteUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !["doctor", "nurse"].includes(role)) {
      return res.status(400).json({ message: "role must be doctor or nurse" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const roles = Array.isArray(user.role) ? user.role : [];
    if (!roles.includes(role)) roles.push(role);

    user.role = roles;
    await user.save();

    await Notification.create({
      user: user._id,
      title: "Role updated",
      message: `Admin promoted you to ${role}.`,
      type: "ROLE_UPDATED",
      meta: { role },
    });

    return res.status(200).json({
      message: "User role updated successfully",
      data: { _id: user._id, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};