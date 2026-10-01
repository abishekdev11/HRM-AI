const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const DEFAULT_GEMINI_MODEL = process.env.GOOGLE_MODEL || 'gemini-3.5-flash-lite';

function extractIntentFromGeminiText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonCandidate = codeBlockMatch ? codeBlockMatch[1] : trimmed;

  try {
    const parsed = JSON.parse(jsonCandidate);

    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed.type === 'statusUpdate' ||
        parsed.type === 'leaveDecision' ||
        parsed.type === 'dataQuery' ||
        parsed.type === 'employeeIdUpdate' ||
        parsed.type === 'moduleAction' ||
        parsed.type === 'attendanceAction' ||
        parsed.type === 'dashboardQuery' ||
        parsed.type === 'userDelete')
    ) {
      return {
        ...parsed,
        source: 'gemini'
      };
    }
  } catch (error) {
    return null;
  }

  return null;
}

async function callGeminiFallback(question) {
  if (!GOOGLE_API_KEY) {
    return null;
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;

    const response = await axios.post(endpoint, {
      contents: [{
        parts: [{
          text: `Convert the user's request into exactly one valid JSON action. Correct minor spelling mistakes, grammar mistakes, and natural sentence variations before identifying the intent. Return ONLY JSON with no markdown or extra text.

Allowed structures:
{"type":"statusUpdate","employeeId":"EMP001","isActive":false}
{"type":"leaveDecision","decision":"Approved","target":"leo martin"}
{"type":"dataQuery","entity":"user","isActive":true}
{"type":"employeeIdUpdate","currentEmployeeId":"009","newEmployeeId":"EMP009"}
{"type":"dataQuery","entity":"attendance","scope":"me"}
{"type":"dataQuery","entity":"project"}
{"type":"dataQuery","entity":"client"}
{"type":"dataQuery","entity":"query"}
{"type":"dataQuery","entity":"query","queryIdentifier":"<24-character query id>"}
{"type":"dataQuery","entity":"query","scope":"recipients"}
{"type":"dataQuery","entity":"user","identifier":"EMP001"}
{"type":"moduleAction","module":"department","operation":"create","name":"Engineering","description":"Engineering team"}
{"type":"moduleAction","module":"project","operation":"update","identifier":"Website Refresh","progress":60}
{"type":"moduleAction","module":"query","operation":"create","recipient":"EMP001","subject":"Access request","body":"Please help with access."}
{"type":"moduleAction","module":"leave","operation":"apply","from":"2026-10-01","to":"2026-10-03","leaveType":"Casual","reason":"Personal leave"}
{"type":"moduleAction","module":"attendance","operation":"startBreak","reason":"Lunch"}
{"type":"moduleAction","module":"user","operation":"delete","identifier":"EMP001"}

Rules:
- For approving, accepting, or granting leave, use leaveDecision with decision "Approved".
- For rejecting, denying, or declining leave, use leaveDecision with decision "Rejected".
- Preserve the employee name, employee ID, or email as target.
- For attendance, departments, projects, clients, employee queries, and dashboards, use dataQuery with the matching entity: attendance, department, project, client, query, or dashboard.
- For attendance actions, use attendanceAction with operation progress, startBreak, or endBreak, or moduleAction with module attendance for summary/dashboardDetails. Never authenticate or log out through a tool.
- For department writes, use moduleAction with module department and operation create, update, or deactivate. Include only explicitly supplied fields.
- For project writes, use moduleAction with module project and operation create, update, or archive. Preserve client, team lead, employee identifiers, progress, and status as supplied.
- For employee queries, use moduleAction with module query and operation recipients, create, or reply. Include the intended recipient or query identifier, subject when creating, and exact message body.
- For a query's message history, use dataQuery with entity query and queryIdentifier. For eligible recipients, use dataQuery with entity query and scope recipients.
- For employee profile or detail reads, use dataQuery with entity user and identifier when supplied. Do not request another employee's details unless the user is an admin.
- For leave submission, use moduleAction with module leave and operation apply, including both dates and any supplied type or reason.
- For user deletion, use userDelete with an employee name, employee ID, or email.
- Understand requests such as "can you aprpove Leo's leave" and "please approve the leave of Leo Martin".
- Return null when the request is not one of the allowed actions.

User request: ${question}`
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    const text = response?.data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
    return extractIntentFromGeminiText(text);
  } catch (error) {
    console.error('Gemini fallback error:', error.response?.data || error.message || 'Unknown model error');
    return null;
  }
}

module.exports = {
  callGeminiFallback,
  extractIntentFromGeminiText,
};
