const bcrypt = require("bcrypt");
const User = require("../models/User");
const Department = require("../models/Department");
const {
  getPendingUserDraft,
  savePendingUserDraft,
  clearPendingUserDraft,
  savePendingDraft,
  getPendingDraftFor,
  clearPendingDraft,
} = require("../agents/chatMemory");

const roleOptions = ["admin", "hr", "employee", "manager"];

function buildActionResult({ success, message, operation, entityType, data, handled = true }) {
  return {
    success,
    handled,
    operation,
    entityType,
    message,
    summary: message,
    data,
  };
}

function getChangedUserUpdates(user, updates) {
  return Object.fromEntries(
    Object.entries(updates).filter(([field, value]) => {
      const currentValue = user[field];
      return String(currentValue) !== String(value);
    })
  );
}

async function findUserByIdentifier(identifier) {
  if (!identifier) return null;

  const cleanIdentifier = String(identifier).trim();

  if (/^[0-9a-fA-F]{24}$/.test(cleanIdentifier)) {
    const user = await User.findById(cleanIdentifier).populate("department", "name");
    if (user) return user;
  }

  return User.findOne({
    $or: [
      { employeeId: new RegExp(cleanIdentifier, "i") },
      { email: new RegExp(cleanIdentifier, "i") },
      { name: new RegExp(cleanIdentifier, "i") },
    ],
  }).populate("department", "name");
}

async function getDepartmentNameFromText(question) {
  const departments = await Department.find({}, { name: 1, _id: 1 });

  const match = departments.find((department) =>
    new RegExp(department.name, "i").test(question)
  );

  return match ? match._id : null;
}

function extractValue(question, patterns) {
  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      return String(match[1] || match[0] || "").trim();
    }
  }

  return null;
}

function extractColonSeparatedValue(question, fieldNames) {
  const nextFieldPattern = "(?:name|full\\s+name|employee\\s+name|email|e-mail|empid|emp\\s*id|employee\\s*id|department|dept|designation|title|position|role|password|pass)";

  for (const fieldName of fieldNames) {
    const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const colonPattern = new RegExp(
      `${escapedField}\\s*(?:[:=]|as|is|to)?\\s*([A-Za-z0-9@._%+\\-/\\s'\\.-]+?)(?=\\s+(?:${nextFieldPattern})\\b|$)`,
      "i"
    );

    const match = question.match(colonPattern);
    if (match) {
      const value = String(match[1] || "").trim();
      if (value && value.length > 0) return value;
    }
  }
  return null;
}

async function createUserFromPrompt({ actor, question }) {
  if (!actor) {
    return buildActionResult({
      success: false,
      message: "You must be logged in to create users.",
      operation: "user.create",
      entityType: "user",
    });
  }

  if (actor.role !== "admin") {
    return buildActionResult({
      success: false,
      message: "Only admins can create new users.",
      operation: "user.create",
      entityType: "user",
    });
  }

  const text = String(question || "").trim();
  const extractionText = text.replace(/[,;]+/g, " ");

  const email = extractColonSeparatedValue(extractionText, ["email", "e-mail"]) || extractValue(extractionText, [
    /(?:email|e-mail)\s*(?:as|is|:|=|to)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i,
  ]);

  const extractedEmployeeId = extractColonSeparatedValue(extractionText, ["empid", "emp id", "employee id", "employeeid"]) || extractValue(extractionText, [
    /(?:employee\s*id|emp\s*id|empid)\s*(?:as|is|:|=|to)?\s*([A-Z0-9-]+)/i,
    /\b(?:EMP)?(\d{2,})\b/i,
    /\b([A-Z]{2,}\d{2,})\b/i,
  ]);

  let employeeId = extractedEmployeeId;
  if (employeeId) {
    employeeId = employeeId.replace(/\s+/g, "").toUpperCase();
  }

  const name = extractColonSeparatedValue(extractionText, ["name", "full name", "employee name"]) || extractValue(extractionText, [
    /(?:name|full\s+name|named)\s*(?:as|is|:|=|to)?\s*([A-Za-z][A-Za-z' .-]*?)(?=\s+(?:with|and|email|e-mail|emp\s*id|empid|role|designation|department|password)|$)/i,
    /(?:create|add|new|register)\s+(?:new\s+)?(?:user|employee)\s+([A-Za-z][A-Za-z' .-]*?)(?=\s+(?:with|and|email|e-mail|emp\s*id|empid|role|designation|department|password)|$)/i,
    /(?:for|named)\s+([A-Za-z][A-Za-z' .-]*?)(?=\s+(?:with|and|email|e-mail|emp\s*id|empid|role|designation|department|password)|$)/i,
  ]);

  const designation = extractColonSeparatedValue(extractionText, ["designation", "title", "position"]) || extractValue(extractionText, [
    /(?:designation|title)\s*(?:is|:|=|to)?\s*([A-Za-z0-9\s.-]+)/i,
  ]);

  const role = extractColonSeparatedValue(extractionText, ["role", "position"]) || extractValue(extractionText, [
    /(?:role\s*(?:is|:|=|to)?\s*|(?:to|as)\s+)(admin|hr|employee|manager)/i,
    /\b(admin|hr|employee|manager)\b/i,
  ]);

  const password = extractColonSeparatedValue(extractionText, ["password", "pass"]) || extractValue(extractionText, [
    /(?:password|pass)\s*(?:is|:|=|to)?\s*([A-Za-z0-9@#$%^&*!]+?)(?=\s+(?:department|designation|role|email|employee|name)|$)/i,
  ]);

  const department = extractColonSeparatedValue(extractionText, ["department", "dept"]) || extractValue(extractionText, [
    /(?:department|dept)\s*(?:is|:|=|to)?\s*([A-Za-z0-9\s.-]+)/i,
  ]);

  const savedDraft = getPendingUserDraft(actor);
  const mergedFields = {
    ...savedDraft,
    ...(name ? { name } : {}),
    ...(employeeId ? { employeeId } : {}),
    ...(email ? { email } : {}),
    ...(department ? { department } : {}),
    ...(designation ? { designation } : {}),
    ...(role ? { role } : {}),
    ...(password ? { password } : {}),
  };

  savePendingDraft(actor, { action: "user.create", fields: mergedFields });

  let departmentId = null;
  if (mergedFields.department) {
    const deptMatch = await Department.findOne({
      name: new RegExp(mergedFields.department, "i")
    }, { _id: 1 });
    departmentId = deptMatch ? deptMatch._id : null;
  }

  if (!departmentId) {
    departmentId = await getDepartmentNameFromText(`${text} ${mergedFields.department || ""}`);
  }

  let finalRole = mergedFields.role ? mergedFields.role.toLowerCase() : null;
  let finalDesignation = mergedFields.designation || null;

  if (finalRole && !roleOptions.includes(finalRole)) {
    if (!finalDesignation || finalDesignation === "Employee") {
      finalDesignation = mergedFields.role;
    }
    finalRole = "employee";
  }

  const payload = {
    employeeId: mergedFields.employeeId ? mergedFields.employeeId.toUpperCase() : null,
    name: mergedFields.name || null,
    email: mergedFields.email || null,
    department: departmentId,
    designation: finalDesignation,
    role: finalRole,
    password: mergedFields.password || null,
  };

  const requiredFields = ["name", "employeeId", "email", "department", "designation", "role", "password"];
  const missingFields = requiredFields.filter((field) => {
    if (field === "department") return !payload.department;
    return !payload[field];
  });

  if (missingFields.length) {
    const providedFields = requiredFields.filter((field) => {
      if (field === "department") return !!payload.department;
      return !!payload[field];
    });

    savePendingUserDraft(actor, mergedFields);

    let feedbackMessage = `I found the following fields: ${providedFields.length > 0 ? providedFields.join(", ") : "none"}.\n\n`;
    feedbackMessage += `Missing required fields: ${missingFields.join(", ")}.\n\n`;
    feedbackMessage += `Please provide all required fields in one of these formats:\n`;
    feedbackMessage += `1. name:John, empid:EMP001, email:john@gmail.com, department:IT, designation:Developer, role:employee, password:Pass@123\n`;
    feedbackMessage += `2. create new employee John with empid EMP001 and email john@gmail.com`;

    return buildActionResult({
      success: false,
      message: feedbackMessage,
      operation: "user.create",
      entityType: "user",
    });
  }

  clearPendingUserDraft(actor);

  const existingUser = await User.findOne({
    $or: [{ employeeId: payload.employeeId }, { email: payload.email }],
  });

  if (existingUser) {
    return buildActionResult({
      success: false,
      message: `A user with employee ID ${payload.employeeId} or email ${payload.email} already exists.`,
      operation: "user.create",
      entityType: "user",
    });
  }

  const departmentExists = await Department.findById(payload.department);
  if (!departmentExists) {
    return buildActionResult({
      success: false,
      message: "The department you mentioned was not found.",
      operation: "user.create",
      entityType: "user",
    });
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const createdUser = await User.create({
    employeeId: payload.employeeId,
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
    department: payload.department,
    designation: payload.designation,
    role: payload.role,
  });

  const savedUser = await User.findById(createdUser._id).populate("department", "name").select("-password");

  return buildActionResult({
    success: true,
    message: `User ${savedUser.name} was created successfully with employee ID ${savedUser.employeeId}.`,
    operation: "user.create",
    entityType: "user",
    data: savedUser,
  });
}

async function updateUserFromPrompt({ actor, question, userIdentifier }) {
  if (!actor) {
    return buildActionResult({
      success: false,
      message: "You must be logged in to update users.",
      operation: "user.update",
      entityType: "user",
    });
  }

  if (actor.role !== "admin") {
    return buildActionResult({
      success: false,
      message: "Only admins can update users.",
      operation: "user.update",
      entityType: "user",
    });
  }

  const text = String(question || "").trim();
  const pendingDraft = getPendingDraftFor(actor, "user.update");
  const savedIdentifier = pendingDraft && pendingDraft.fields && pendingDraft.fields.userIdentifier;
  const savedUpdates = pendingDraft && pendingDraft.fields && pendingDraft.fields.updates ? pendingDraft.fields.updates : {};
  const identifier = userIdentifier || savedIdentifier || extractValue(text, [
    /(?:user|employee)\s*(?:id|number)?\s*(?:is|:|=|to)?\s*([A-Z0-9-]+)/i,
    /(?:email|e-mail)\s*(?:is|:|=|to)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /(?:for|about|named|name)\s*([A-Za-z][A-Za-z' .-]+)/i,
  ]);

  const targetUser = await findUserByIdentifier(identifier || "");

  if (!targetUser) {
    return buildActionResult({
      success: false,
      message: "Could not find that user. Please provide one of the following to identify them:\n• Employee name: 'update John Smith'\n• Employee ID: 'update EMP001'\n• Email: 'update john@gmail.com'\n\nThen specify what to change: 'update email to newemail@gmail.com' or 'change role to manager'",
      operation: "user.update",
      entityType: "user",
    });
  }

  const updates = { ...savedUpdates };

  const targetNameMatch = text.match(/(?:update|change|modify|set|make)\s+(?:the\s+)?(?:user|employee)?\s*([A-Za-z][A-Za-z' .-]+(?:\s+[A-Za-z][A-Za-z' .-]+)*)\b(?=\s+(?:to|status|isActive|is active|active|inactive|email|role|designation|department|name))/i)
    || text.match(/(?:for|about|named|name)\s+([A-Za-z][A-Za-z' .-]+(?:\s+[A-Za-z][A-Za-z' .-]+)*)/i);

  if (targetNameMatch && (!identifier || targetNameMatch[1].toLowerCase() === String(identifier).toLowerCase())) {
    const resolvedIdentifier = targetNameMatch[1].trim();
    if (resolvedIdentifier && !userIdentifier) {
      const resolvedUser = await findUserByIdentifier(resolvedIdentifier);
      if (resolvedUser) {
        Object.assign(targetUser, { _id: resolvedUser._id, name: resolvedUser.name, employeeId: resolvedUser.employeeId });
      }
    }
  }

  const newName = extractValue(text, [
    /(?:name|full\s+name|rename)\s*(?:to|is|:|=)?\s*([A-Za-z][A-Za-z' .-]+)/i,
  ]);
  if (newName) updates.name = newName;

  const newEmail = extractValue(text, [
    /(?:email|e-mail)\s*(?:to|is|:|=)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ]);
  if (newEmail) updates.email = newEmail;

  const newDesignation = extractValue(text, [
    /(?:designation|title)\s*(?:to|is|:|=)?\s*([A-Za-z0-9\s.-]+)/i,
  ]);
  if (newDesignation) updates.designation = newDesignation;

  const newRole = extractValue(text, [
    /(?:role\s*(?:to|is|:|=)?\s*|(?:to|as)\s+)(admin|hr|employee|manager)/i,
  ]);
  if (newRole) updates.role = newRole.toLowerCase();

  const statusValue = extractValue(text, [
    /(?:status|isActive|is active)\s*(?:to|=|is)?\s*(true|false|active|inactive)/i,
    /(?:active|inactive)\s+status\s*(?:to|=|is)?\s*(true|false|active|inactive)/i,
    /(?:to|=|is)\s*(true|false|active|inactive)\b/i,
  ]);

  if (statusValue) {
    updates.isActive = /^(true|active)$/i.test(statusValue);
  }

  const departmentId = await getDepartmentNameFromText(text);
  if (departmentId) updates.department = departmentId;

  if (!identifier) {
    savePendingDraft(actor, { action: "user.update", fields: { userIdentifier: null, updates } });
    return buildActionResult({
      success: false,
      message: "I need to know which user to update. Please provide an employee ID, email, or name. Example: 'update user EMP003 role to manager'",
      operation: "user.update",
      entityType: "user",
    });
  }

  if (!Object.keys(updates).length) {
    savePendingDraft(actor, { action: "user.update", fields: { userIdentifier: identifier, updates: {} } });
    return buildActionResult({
      success: false,
      message: "No update fields found. To update a user, provide what to change:\n• 'update email to newemail@gmail.com'\n• 'change role to manager'\n• 'update designation to Senior Developer'\n• 'change department to IT'\n\nExample: 'update user EMP003 role to manager'",
      operation: "user.update",
      entityType: "user",
    });
  }

  savePendingDraft(actor, { action: "user.update", fields: { userIdentifier: identifier, updates } });

  if (updates.email) {
    const emailInUse = await User.findOne({ email: updates.email, _id: { $ne: targetUser._id } });
    if (emailInUse) {
      return buildActionResult({
        success: false,
        message: "That email is already in use by another user.",
        operation: "user.update",
        entityType: "user",
      });
    }
  }

  const changedUpdates = getChangedUserUpdates(targetUser, updates);
  if (!Object.keys(changedUpdates).length) {
    clearPendingDraft(actor);
    return buildActionResult({
      success: true,
      message: `User ${targetUser.name} is already in the requested state. No changes were made.`,
      operation: "user.update",
      entityType: "user",
      data: targetUser,
    });
  }

  clearPendingDraft(actor);
  Object.assign(targetUser, changedUpdates);
  await targetUser.save();

  const updatedUser = await User.findById(targetUser._id).populate("department", "name").select("-password");

  return buildActionResult({
    success: true,
    message: `User ${updatedUser.name} was updated successfully.`,
    operation: "user.update",
    entityType: "user",
    data: updatedUser,
  });
}

async function executeUserAction(action) {
  if (!action || (action.type !== "employeeIdUpdate" && action.type !== "statusUpdate")) return null;

  const identifier = action.employeeId || action.currentEmployeeId;
  let user = await User.findOne({ employeeId: identifier });

  if (!user && identifier) {
    user = await User.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(identifier)}$`, "i") },
    });
  }

  if (!user) return "No employee found.";

  if (action.type === "employeeIdUpdate") {
    const alreadySet = user.employeeId.toLowerCase() === String(action.newEmployeeId).toLowerCase();
    if (!alreadySet) {
      user.employeeId = action.newEmployeeId;
      await user.save();
    }

    return alreadySet
      ? `Employee ID is already ${user.employeeId}. No changes were made.`
      : `Employee ID updated from ${action.currentEmployeeId} to ${action.newEmployeeId}.`;
  }

  const alreadySet = user.isActive === action.isActive;
  if (!alreadySet) {
    user.isActive = action.isActive;
    await user.save();
  }

  return alreadySet
    ? `Employee ${user.employeeId} is already ${action.isActive ? "active" : "inactive"}. No changes were made.`
    : `Employee ${user.employeeId} status updated to ${action.isActive ? "active" : "inactive"}.`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  findUserByIdentifier,
  createUserFromPrompt,
  updateUserFromPrompt,
  getChangedUserUpdates,
  executeUserAction,
};
