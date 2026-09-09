require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./models/User");
const Department = require("./models/Department");

async function seedAdmin() {

    try {

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected");

        // -------------------------
        // Find IT Department
        // -------------------------

        let department = await Department.findOne({
            name: "IT",
        });

        // If not exists, create it

        if (!department) {

            department = await Department.create({

                name: "IT",

                description: "Information Technology"

            });

        }

        // -------------------------
        // Check Existing Admin
        // -------------------------

        const existingAdmin = await User.findOne({

            role: "admin"

        });

        if (existingAdmin) {

            console.log("Admin already exists.");

            process.exit();

        }

        // -------------------------
        // Hash Password
        // -------------------------

        const hashedPassword = await bcrypt.hash(

            "Admin@123",

            10

        );

        // -------------------------
        // Create Admin
        // -------------------------

        await User.create({

            employeeId: "EMP001",

            name: "Abishek",

            email: "admin@company.com",

            password: hashedPassword,

            department: department._id,

            designation: "System Administrator",

            role: "admin",

        });

        console.log("Admin Created Successfully");

        process.exit();

    }

    catch (error) {

        console.error(error);

        process.exit();

    }

}

seedAdmin();