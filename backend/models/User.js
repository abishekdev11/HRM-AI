const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    password: {
        type: String,
        required: true,
    },

    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
    },

    designation: {
        type: String,
        required: true,
        trim: true,
    },

    role: {
        type: String,
        enum: ["admin", "hr", "employee","manager"],
        default: "employee",
    },

    isActive: {
        type: Boolean,
        default: true,
    },
},
{
    timestamps: true,
});

module.exports = mongoose.model("User", userSchema);