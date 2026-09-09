const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {

        let token;

        // Check Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // No token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access Denied. No token provided."
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
const user = await User.findById(decoded.userId)
    .populate("department", "name")
    .select("-password");
    
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        // Store logged-in user
        req.user = user;

        // -------------------------
        // Reject if user is inactive
        // -------------------------
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact Admin."
            });
        }

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }
};

module.exports = protect;