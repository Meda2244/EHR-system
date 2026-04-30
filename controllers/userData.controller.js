const UserData = require("../models/userData.model");

// GET /api/user-data/me
exports.getMyUserData = async (req, res) => {
  try {
    const data = await UserData.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("addedBy", "firstName lastName email");

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE /api/user-data/:id 
exports.deleteMyUserData = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await UserData.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!deleted) return res.status(404).json({ message: "Data not found" });

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};