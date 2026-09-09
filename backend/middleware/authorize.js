function authorize(...roles) {

    return (req, res, next) => {

        // -------------------------
        // User must exist
        // -------------------------

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized"

            });

        }

        // -------------------------
        // Check Role
        // -------------------------

        if (!roles.includes(req.user.role)) {

            return res.status(403).json({

                success: false,

                message: "You don't have permission to access this resource."

            });

        }

        next();

    };

}

module.exports = authorize;