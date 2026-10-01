const Department = require("../models/Department");

function isAdmin(actor) {
  return actor && actor.role === "admin";
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findDepartment(identifier) {
  if (!identifier) return null;
  const value = String(identifier).trim();
  if (/^[0-9a-fA-F]{24}$/.test(value)) {
    const byId = await Department.findById(value);
    if (byId) return byId;
  }
  return Department.findOne({ name: new RegExp(`^${escapeRegex(value)}$`, "i") });
}

async function executeDepartmentAction(action, actor) {
  if (!action || action.type !== "moduleAction" || action.module !== "department") return null;

  if (action.operation === "list") {
    const filter = action.includeInactive && isAdmin(actor) ? {} : { isActive: true };
    const departments = await Department.find(filter).sort({ name: 1 });
    return departments.length
      ? departments.map((department) => `${department.name}: ${department.description}${department.isActive ? "" : " (Inactive)"}`).join("\n")
      : "No departments found.";
  }

  if (!isAdmin(actor)) return "Only admins can create or update departments.";

  if (action.operation === "create") {
    const name = String(action.name || "").trim();
    const description = String(action.description || "").trim();
    if (!name || !description) return "A department name and description are required.";
    if (await Department.exists({ name: new RegExp(`^${escapeRegex(name)}$`, "i") })) {
      return `Department ${name} already exists.`;
    }
    const department = await Department.create({ name, description });
    return `Department ${department.name} was created.`;
  }

  const department = await findDepartment(action.identifier || action.name);
  if (!department) return "Department not found.";

  if (action.operation === "deactivate") {
    department.isActive = false;
    await department.save();
    return `Department ${department.name} was deactivated.`;
  }

  if (action.operation === "update") {
    if (action.name) department.name = String(action.name).trim();
    if (action.description) department.description = String(action.description).trim();
    if (typeof action.isActive === "boolean") department.isActive = action.isActive;
    await department.save();
    return `Department ${department.name} was updated.`;
  }

  return "Unsupported department action.";
}

async function executeDepartmentDataQuery(action, actor) {
  const canSeeInactive = isAdmin(actor);
  const filter = canSeeInactive && typeof action.isActive === "boolean"
    ? { isActive: action.isActive }
    : { isActive: true };
  const departments = await Department.find(filter).sort({ name: 1 });
  return departments.length
    ? departments.map((department) => `${department.name}: ${department.description}`).join("\n")
    : "No departments found.";
}

module.exports = { executeDepartmentAction, executeDepartmentDataQuery };