const STAFF_ROLES = new Set(['manager', 'hr']);
const PRIVILEGED_ROLES = new Set(['admin', 'manager', 'hr']);

function canStartQuery(senderRole, recipientRole) {
  if (senderRole === 'employee') return STAFF_ROLES.has(recipientRole);
  if (!PRIVILEGED_ROLES.has(senderRole)) return false;
  if (recipientRole === 'employee') return STAFF_ROLES.has(senderRole);
  return PRIVILEGED_ROLES.has(recipientRole);
}

module.exports = { canStartQuery };