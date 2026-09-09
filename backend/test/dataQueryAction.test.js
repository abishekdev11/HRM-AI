const test = require('node:test');
const assert = require('node:assert/strict');

const { executeDataQueryAction } = require('../agents/chatAgent');

test('returns no data for empty user query', async () => {
  const result = await executeDataQueryAction({ type: 'dataQuery', entity: 'user', role: 'hr' });
  assert.equal(result, 'No data found.');
});

test('returns no data for empty leave query', async () => {
  const result = await executeDataQueryAction({ type: 'dataQuery', entity: 'leave', status: 'Approved' });
  assert.equal(result, 'No data found.');
});
