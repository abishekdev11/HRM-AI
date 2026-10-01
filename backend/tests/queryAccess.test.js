const test = require('node:test');
const assert = require('node:assert/strict');
const { canStartQuery } = require('../utils/queryAccess');

test('employees can communicate only with managers and HR', () => {
  assert.equal(canStartQuery('employee', 'manager'), true);
  assert.equal(canStartQuery('employee', 'hr'), true);
  assert.equal(canStartQuery('employee', 'admin'), false);
  assert.equal(canStartQuery('employee', 'employee'), false);
});

test('only managers and HR can communicate with employees', () => {
  assert.equal(canStartQuery('manager', 'employee'), true);
  assert.equal(canStartQuery('hr', 'employee'), true);
  assert.equal(canStartQuery('admin', 'employee'), false);
});

test('admin, manager, and HR can communicate with one another', () => {
  for (const senderRole of ['admin', 'manager', 'hr']) {
    for (const recipientRole of ['admin', 'manager', 'hr']) {
      assert.equal(canStartQuery(senderRole, recipientRole), true);
    }
  }
});

test('unknown roles cannot communicate', () => {
  assert.equal(canStartQuery('unknown', 'manager'), false);
  assert.equal(canStartQuery('manager', 'unknown'), false);
});