const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "moderator", "support"],
      default: "moderator",
    },
    permissions: {
      type: [String],
      enum: [
        "*",
        "dashboard",
        "task",
        "message",
        "announcement",
        "users",
        "wallet",
        "payroll",
        "order",
        "invite",
        "transaction",
        "kyc",
      ],
      default: [],
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminSchema);
