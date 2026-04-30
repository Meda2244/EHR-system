const mongoose = require("mongoose");

const userDataSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // admin
    text: { type: String, required: true, trim: true },
    images: [{ type: String, trim: true }], // stored as "uploads/xxx.jpg"
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserData", userDataSchema);