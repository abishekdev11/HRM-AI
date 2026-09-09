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
        parsed.type === 'employeeIdUpdate')
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

Rules:
- For approving, accepting, or granting leave, use leaveDecision with decision "Approved".
- For rejecting, denying, or declining leave, use leaveDecision with decision "Rejected".
- Preserve the employee name, employee ID, or email as target.
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
