const test = require('node:test');
const assert = require('node:assert/strict');
const { parseAction, parseDataQueryAction } = require('../agents/intentRouter');

test('module read requests map to scoped data queries', () => {
  assert.deepEqual(parseDataQueryAction('show my attendance today'), {
    type: 'dataQuery', entity: 'attendance', scope: 'todayMine',
  });
  assert.deepEqual(parseDataQueryAction('show team attendance today'), {
    type: 'dataQuery', entity: 'attendance', scope: 'today',
  });
  assert.deepEqual(parseDataQueryAction('show attendance summary'), {
    type: 'dataQuery', entity: 'dashboard', scope: 'summary',
  });
  assert.deepEqual(parseDataQueryAction('list active projects'), {
    type: 'dataQuery', entity: 'project', status: 'Active',
  });
  assert.deepEqual(parseDataQueryAction('show clients'), {
    type: 'dataQuery', entity: 'client',
  });
  assert.deepEqual(parseDataQueryAction('show me the Nexus Mobile App client details'), {
    type: 'dataQuery', entity: 'client', identifier: 'Nexus Mobile App',
  });
  assert.deepEqual(parseDataQueryAction('show client details for project Aurora Website'), {
    type: 'dataQuery', entity: 'client', identifier: 'Aurora Website',
  });
  assert.deepEqual(parseDataQueryAction('who is the team lead of pulse crm project'), {
    type: 'dataQuery', entity: 'project', scope: 'teamLead', identifier: 'pulse crm',
  });
  assert.deepEqual(parseDataQueryAction('list me the employees assigned to atlas dashboard'), {
    type: 'dataQuery', entity: 'project', scope: 'employees', identifier: 'atlas dashboard',
  });
  assert.deepEqual(parseDataQueryAction('list my queries'), {
    type: 'dataQuery', entity: 'query',
  });
  assert.deepEqual(parseDataQueryAction('show people I can message'), {
    type: 'dataQuery', entity: 'query', scope: 'recipients',
  });
  assert.deepEqual(parseDataQueryAction('show my profile'), {
    type: 'dataQuery', entity: 'user',
  });
  assert.deepEqual(parseDataQueryAction(`show messages for query ${'a'.repeat(24)}`), {
    type: 'dataQuery', entity: 'query', queryIdentifier: 'a'.repeat(24),
  });
});

test('attendance controls and destructive user requests map to tools', () => {
  assert.deepEqual(parseAction('start a lunch break'), {
    type: 'attendanceAction', operation: 'startBreak', reason: 'lunch',
  });
  assert.deepEqual(parseAction('end my break'), {
    type: 'attendanceAction', operation: 'endBreak',
  });
  assert.deepEqual(parseAction('delete employee EMP007'), {
    type: 'userDelete', identifier: 'EMP007',
  });
});