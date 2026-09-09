const test = require('node:test');
const assert = require('node:assert/strict');

const { extractIntentFromGeminiText } = require('../services/llm');
const { parseAction, findClosestUserNameMatch } = require('../agents/chatAgent');

test('parses a structured Gemini fallback response', () => {
  const result = extractIntentFromGeminiText(`\n\n\`\`\`json
{"type":"leaveDecision","decision":"Approved","target":"leo martin","source":"gemini"}
\`\`\`
`);

  assert.deepEqual(result, {
    type: 'leaveDecision',
    decision: 'Approved',
    target: 'leo martin',
    source: 'gemini'
  });
});

test('returns null for unstructured Gemini output', () => {
  const result = extractIntentFromGeminiText('I think you want to approve the leave for leo martin.');
  assert.equal(result, null);
});

test('strips punctuation from leave approval names before matching', () => {
  const result = parseAction('approve the leave for leo martin.');
  assert.deepEqual(result, {
    type: 'leaveDecision',
    decision: 'Approved',
    target: 'leo martin',
    source: 'command'
  });
});

test('finds the closest employee name when the query is misspelled', () => {
  const result = findClosestUserNameMatch('leo marttin', [
    { name: 'Leo Martin' },
    { name: 'Priya Sharma' }
  ]);

  assert.deepEqual(result, { name: 'Leo Martin' });
});
