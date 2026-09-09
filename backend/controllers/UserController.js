const User = require("../models/User");
const Department = require("../models/Department");
const bcrypt = require("bcrypt");

async function createUser(req, res) {

    try {

        const {

            employeeId,
            name,
            email,
            password,
            department,
            designation,
            role

        } = req.body;

        // -------------------------
        // Validate Fields
        // -------------------------

        if (
            !employeeId ||
            !name ||
            !email ||
            !password ||
            !department ||
            !designation ||
            !role
        ) {

            return res.status(400).json({

                success: false,

                message: "All fields are required."

            });

        }

        // -------------------------
        // Check Employee ID
        // -------------------------

        const employeeExists = await User.findOne({

            employeeId

        });

        if (employeeExists) {

            return res.status(400).json({

                success: false,

                message: "Employee ID already exists."

            });

        conso
        }

        // -------------------------
        // Check Email
        // -------------------------

        const emailExists = await User.findOne({

            email

        });

        if (emailExists) {

            return res.status(400).json({

                success: false,

                message: "Email already exists."

            });

        }

        // -------------------------
        // Check Department
        // -------------------------

        const departmentExists = await Department.findById(department);

        if (!departmentExists) {

            return res.status(404).json({

                success: false,

                message: "Department not found."

            });

        }

        // -------------------------
        // Hash Password
        // -------------------------

        const hashedPassword = await bcrypt.hash(password, 10);

        // -------------------------
        // Create User
        // -------------------------

        const user = await User.create({

            employeeId,

            name,

            email,

            password: hashedPassword,

            department,

            designation,

            role

        });

        return res.status(201).json({

            success: true,

            message: "User created successfully.",

            data: {

                _id: user._id,

                employeeId: user.employeeId,

                name: user.name,

                email: user.email,

                designation: user.designation,

                role: user.role

            }

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

}

async function getUsers(req, res) {

    try {

        const {

            search = "",

            role,

            department,

            isActive,

            page = 1,

            limit = 10

        } = req.query;

        const filter = {};

        // -------------------------
        // Search
        // -------------------------

        if (search) {

            filter.$or = [

                {
                    employeeId: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    name: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    email: {
                        $regex: search,
                        $options: "i"
                    }
                }

            ];

        }

        // -------------------------
        // Role Filter
        // -------------------------

        if (role) {

            filter.role = role;

        }

        // -------------------------
        // Department Filter
        // -------------------------

        if (department) {

            filter.department = department;

        }

        // -------------------------
        // Active Filter
        // -------------------------

       if (isActive === "true") {
    filter.isActive = true;
} else if (isActive === "false") {
    filter.isActive = false;
}

        // -------------------------
        // Total Count
        // -------------------------

        const total = await User.countDocuments(filter);

        // -------------------------
        // Users
        // -------------------------

        const users = await User.find(filter)

            .populate("department", "name")

            .select("-password")

            .sort({ createdAt: -1 })

            .skip((page - 1) * Number(limit))

            .limit(Number(limit));

        return res.json({

            success: true,

            page: Number(page),

            totalPages: Math.ceil(total / limit),

            total,

            data: users

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"
        });
    }
}

async function getUserById(req, res) {

    try {

        const { id } = req.params;

        const user = await User.findById(id)

            .populate("department", "name")

            .select("-password");

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }

        return res.json({

            success: true,

            data: user

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

}

async function updateUser(req, res) {

    try {

        const { id } = req.params;

        const {

            name,
            email,
            department,
            designation,
            role

        } = req.body;

        // -------------------------
        // Find User
        // -------------------------

        const user = await User.findById(id);

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }

        // -------------------------
        // Email Already Exists
        // -------------------------

        if (email && email !== user.email) {

            const existingEmail = await User.findOne({

                email

            });

            if (existingEmail) {

                return res.status(400).json({

                    success: false,

                    message: "Email already exists."

                });

            }

        }

        // -------------------------
        // Department Exists
        // -------------------------

        if (department) {

            const departmentExists = await Department.findById(department);

            if (!departmentExists) {

                return res.status(404).json({

                    success: false,

                    message: "Department not found."

                });

            }

        }

        // -------------------------
        // Update Fields
        // -------------------------

        user.name = name ?? user.name;

        user.email = email ?? user.email;

        user.department = department ?? user.department;

        user.designation = designation ?? user.designation;

        user.role = role ?? user.role;

        await user.save();

        const updatedUser = await User.findById(user._id)

            .populate("department", "name")

            .select("-password");

        return res.json({

            success: true,

            message: "User updated successfully.",

            data: updatedUser

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

}

async function updateUserStatus(req, res) {

    try {

        const { id } = req.params;

        const { isActive } = req.body;

        // -------------------------
        // Validate Input
        // -------------------------

        if (typeof isActive !== "boolean") {

            return res.status(400).json({

                success: false,

                message: "isActive must be true or false."

            });

        }

        // -------------------------
        // Find User
        // -------------------------

        const user = await User.findById(id);

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }

        // -------------------------
        // Update Status
        // -------------------------

        user.isActive = isActive;

        await user.save();

        return res.json({

            success: true,

            message: `User ${isActive ? "activated" : "deactivated"} successfully.`,

            data: user

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

}

async function deleteUser(req, res) {

    try {

        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }

        // Prevent deleting yourself
        if (req.user._id.toString() === user._id.toString()) {

            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account."
            });
        }

        await User.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "User deleted successfully."
       });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}
module.exports = {createUser, getUsers, getUserById, updateUser, updateUserStatus, deleteUser};