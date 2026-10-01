const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
const Client = require("../models/Client");

const userProjection = "name employeeId email designation role";

const populateProject = (query) => query
  .populate("client", "name address email contactNo")
  .populate("teamLead", userProjection)
  .populate("employees", userProjection);

const validateUsers = async (teamLead, employees = []) => {
  const ids = [teamLead, ...employees];
  if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return false;
  }

  const users = await User.find({ _id: { $in: ids }, isActive: true }).select("_id");
  return users.length === new Set(ids.map(String)).size;
};

const getProjects = async (req, res) => {
  try {
    const projects = await populateProject(
      Project.find({ isActive: true }).sort({ createdAt: -1 })
    ).lean();

    return res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("Get projects error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await populateProject(
      Project.findOne({ _id: req.params.id, isActive: true })
    ).lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Get project error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const createProject = async (req, res) => {
  try {
    const {
      name,
      client,
      progress,
      teamLead,
      employees = [],
      accent,
      status,
    } = req.body;

    if (!name || !client || progress === undefined || !teamLead) {
      return res.status(400).json({
        success: false,
        message: "Name, client, progress, and team lead are required",
      });
    }

    const numericProgress = Number(progress);
    if (!Number.isInteger(numericProgress) || numericProgress < 0 || numericProgress > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress must be a whole number from 0 to 100",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(client) || !(await Client.exists({ _id: client, isActive: true }))) {
      return res.status(400).json({
        success: false,
        message: "Client must be an active client record",
      });
    }

    if (!Array.isArray(employees) || !(await validateUsers(teamLead, employees))) {
      return res.status(400).json({
        success: false,
        message: "Team lead and employees must be active users",
      });
    }

    const project = await Project.create({
      name,
      client,
      progress: numericProgress,
      teamLead,
      employees,
      accent,
      status,
    });

    const populatedProject = await populateProject(Project.findById(project._id)).lean();
    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: populatedProject,
    });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, isActive: true });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const updates = { ...req.body };
    if (updates.progress !== undefined) {
      updates.progress = Number(updates.progress);
      if (!Number.isInteger(updates.progress) || updates.progress < 0 || updates.progress > 100) {
        return res.status(400).json({ success: false, message: "Progress must be a whole number from 0 to 100" });
      }
    }

    const nextTeamLead = updates.teamLead || project.teamLead;
    const nextEmployees = updates.employees || project.employees;
    if (!(await validateUsers(nextTeamLead, nextEmployees))) {
      return res.status(400).json({ success: false, message: "Team lead and employees must be active users" });
    }

    if (updates.client && (!mongoose.Types.ObjectId.isValid(updates.client)
      || !(await Client.exists({ _id: updates.client, isActive: true })))) {
      return res.status(400).json({ success: false, message: "Client must be an active client record" });
    }

    Object.assign(project, updates);
    await project.save();

    const populatedProject = await populateProject(Project.findById(project._id)).lean();
    return res.status(200).json({ success: true, message: "Project updated successfully", data: populatedProject });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const archiveProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    return res.status(200).json({ success: true, message: "Project archived successfully" });
  } catch (error) {
    console.error("Archive project error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
};