const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    progress: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    accent: {
      type: String,
      default: "#0f766e",
      match: /^#[0-9a-fA-F]{6}$/,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "On Hold"],
      default: "Active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);