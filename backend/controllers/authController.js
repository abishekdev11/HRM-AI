const User = require("../models/User");
const Attendance = require("../models/Attendance");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function login(req, res) {
  try {
    const { employeeId, password } = req.body;
    console.log(req.body)

    // -------------------------
    // Validation
    // -------------------------

    if (!employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and Password are required",
      });
    }

    // -------------------------
    // Find User
    // -------------------------

    const user = await User.findOne({
      employeeId,
    }).populate("department", "name");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee ID or Password",
      });
    }

    // -------------------------
    // Check Active
    // -------------------------

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact Admin.",
      });
    }

    // -------------------------
    // Compare Password
    // -------------------------

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee ID or Password",
      });
    }

    // -------------------------
    // Record Attendance (Auto check-in on login)
    // -------------------------

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ user: user._id, date: today });

    if (!attendance) {
      // Create new attendance record on first login
      attendance = await Attendance.create({
        user: user._id,
        date: today,
        status: 'Present',
        loginTime: new Date(),
      });
    } else if (!attendance.loginTime) {
      // Update login time if it doesn't exist
      attendance.loginTime = new Date();
      await attendance.save();
    }

    // -------------------------
    // Generate JWT
    // -------------------------

    const token = jwt.sign(
      {
        userId: user._id,
        employeeId: user.employeeId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // -------------------------
    // Success
    // -------------------------

    return res.status(200).json({
      success: true,
      message: "Login Successful",

      token,

      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        designation: user.designation,
        department: user.department,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

async function logout(req, res) {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ user: userId, date: today });

    if (attendance) {
      attendance.logoutTime = new Date();
      await attendance.save();
    }

    return res.status(200).json({
      success: true,
      message: "Logout Successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  login,
  logout,
};