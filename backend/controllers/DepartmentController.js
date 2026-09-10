const Department = require("../models/Department");

// Create Department
const createDepartment = async (req, res) => {
  try {

    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingDepartment = await Department.findOne({ name });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

    const department = await Department.create({
      name,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

// Get All Departments
const getDepartments = async (req, res) => {
  try {
    const { all } = req.query;
    const filter = {};

    if (all !== "true") {
      filter.isActive = true;
    }

    const departments = await Department.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const nameConflict = await Department.findOne({
      name,
      _id: { $ne: id },
    });

    if (nameConflict) {
      return res.status(409).json({
        success: false,
        message: "Department name is already in use",
      });
    }

    department.name = name;
    department.description = description;

    if (typeof isActive === "boolean") {
      department.isActive = isActive;
    }

    await department.save();

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    department.isActive = false;
    await department.save();

    res.status(200).json({
      success: true,
      message: "Department deactivated successfully",
      department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
};