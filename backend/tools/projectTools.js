const mongoose = require("mongoose");
const Client = require("../models/Client");
const Project = require("../models/Project");
const User = require("../models/User");

function canManage(actor) {
  return actor && ["admin", "manager"].includes(actor.role);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findByIdOrName(Model, identifier, extraFilter = {}) {
  if (!identifier) return null;
  const value = String(identifier).trim();
  if (mongoose.Types.ObjectId.isValid(value)) {
    const byId = await Model.findOne({ _id: value, ...extraFilter });
    if (byId) return byId;
  }
  return Model.findOne({ name: new RegExp(`^${escapeRegex(value)}$`, "i"), ...extraFilter });
}

async function resolveUser(identifier) {
  if (!identifier) return null;
  const value = String(identifier).trim();
  return User.findOne({
    isActive: true,
    $or: [
      { employeeId: value.toUpperCase() },
      { name: new RegExp(`^${escapeRegex(value)}$`, "i") },
      ...(mongoose.Types.ObjectId.isValid(value) ? [{ _id: value }] : []),
    ],
  });
}

function formatProject(project) {
  return `${project.name} (${project.status}, ${project.progress}%): ${project.client?.name || "Unknown client"}; team lead ${project.teamLead?.name || "Unassigned"}`;
}

async function executeProjectDataQuery(action) {
  if (action.entity === "client") {
    if (action.identifier) {
      const project = await findByIdOrName(Project, action.identifier, { isActive: true });
      if (!project) return "Active project not found.";
      await project.populate({
        path: "client",
        select: "name email address contactNo",
        match: { isActive: true },
      });
      if (!project.client) return "No active client found for this project.";
      return `Project: ${project.name}\nClient: ${project.client.name}\nEmail: ${project.client.email}\nContact: ${project.client.contactNo}\nAddress: ${project.client.address}`;
    }

    const clients = await Client.find({ isActive: true }).sort({ name: 1 });
    return clients.length ? clients.map((client) => `${client.name}: ${client.email}`).join("\n") : "No active clients found.";
  }

  const filter = { isActive: true };
  if (action.status) filter.status = action.status;
  if (action.identifier) {
    const project = await findByIdOrName(Project, action.identifier, filter);
    if (!project) return "Active project not found.";

    if (action.scope === "teamLead") {
      await project.populate("teamLead", "name");
      return project.teamLead
        ? `Team lead for ${project.name}: ${project.teamLead.name}`
        : `No team lead is assigned to ${project.name}.`;
    }

    if (action.scope === "employees") {
      await project.populate({
        path: "employees",
        select: "employeeId name designation",
        options: { sort: { name: 1 } },
      });
      if (!project.employees.length) return `No employees are assigned to ${project.name}.`;
      const employees = project.employees
        .map((employee) => `${employee.name} (${employee.employeeId})${employee.designation ? `, ${employee.designation}` : ""}`)
        .join("\n");
      return `Employees assigned to ${project.name}:\n${employees}`;
    }

    await project.populate("client", "name");
    await project.populate("teamLead", "name");
    return formatProject(project);
  }
  const projects = await Project.find(filter)
    .populate("client", "name")
    .populate("teamLead", "name")
    .sort({ createdAt: -1 });
  return projects.length ? projects.map(formatProject).join("\n") : "No active projects found.";
}

async function executeProjectAction(action, actor) {
  if (!action || action.type !== "moduleAction" || action.module !== "project") return null;
  if (action.operation === "list") return executeProjectDataQuery({ entity: "project", status: action.status });
  if (action.operation === "listClients") return executeProjectDataQuery({ entity: "client" });
  if (action.operation === "get") return executeProjectDataQuery({ entity: "project", identifier: action.identifier || action.name });
  if (!canManage(actor)) return "Only admins or managers can create, update, or archive projects.";

  if (action.operation === "archive") {
    const project = await findByIdOrName(Project, action.identifier || action.name, { isActive: true });
    if (!project) return "Active project not found.";
    project.isActive = false;
    await project.save();
    return `Project ${project.name} was archived.`;
  }

  let project;
  if (action.operation === "create") {
    project = new Project();
  } else if (action.operation === "update") {
    project = await findByIdOrName(Project, action.identifier || action.name, { isActive: true });
    if (!project) return "Active project not found.";
  } else {
    return "Unsupported project action.";
  }

  const nextName = action.projectName || (action.operation === "create" ? action.name : null);
  if (nextName) project.name = String(nextName).trim();
  if (action.client) {
    const client = await findByIdOrName(Client, action.client, { isActive: true });
    if (!client) return "An active client matching that name was not found.";
    project.client = client._id;
  }
  if (action.teamLead) {
    const teamLead = await resolveUser(action.teamLead);
    if (!teamLead) return "An active team lead matching that name or employee ID was not found.";
    project.teamLead = teamLead._id;
  }
  if (action.employees !== undefined) {
    if (!Array.isArray(action.employees)) return "Project employees must be provided as a list.";
    const employees = await Promise.all(action.employees.map(resolveUser));
    if (employees.some((employee) => !employee)) return "Every project employee must be an active user.";
    project.employees = employees.map((employee) => employee._id);
  }
  if (action.progress !== undefined) {
    const progress = Number(action.progress);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) return "Project progress must be a whole number from 0 to 100.";
    project.progress = progress;
  }
  if (action.status !== undefined) {
    if (!["Active", "Completed", "On Hold"].includes(action.status)) return "Project status must be Active, Completed, or On Hold.";
    project.status = action.status;
  }
  if (action.accent !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(action.accent)) return "Project accent must be a six-digit hex color.";
    project.accent = action.accent;
  }
  if (!project.name || !project.client || !project.teamLead || project.progress === undefined) {
    return "Project name, active client, team lead, and progress are required.";
  }

  await project.save();
  const saved = await Project.findById(project._id).populate("client", "name").populate("teamLead", "name");
  return `Project ${saved.name} was ${action.operation === "create" ? "created" : "updated"}. ${formatProject(saved)}`;
}

module.exports = { executeProjectAction, executeProjectDataQuery };