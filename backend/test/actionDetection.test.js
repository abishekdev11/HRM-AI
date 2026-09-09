const test = require('node:test');
const assert = require('node:assert/strict');

const { parseEmployeeStatusAction, parseEmployeeIdUpdateAction } = require('../agents/chatAgent');

test('parses update status action with employee id and boolean', () => {
  const result = parseEmployeeStatusAction('update EMP009 isActive status to true');

  assert.deepEqual(result, {
    type: 'statusUpdate',
    employeeId: 'EMP009',
    isActive: true,
    source: 'command'
  });
});

test('parses set status action with false value', () => {
  const result = parseEmployeeStatusAction('set EMP009 isActive status to false');

  assert.deepEqual(result, {
    type: 'statusUpdate',
    employeeId: 'EMP009',
    isActive: false,
    source: 'command'
  });
});

test('parses employee id update command', () => {
  const result = parseEmployeeIdUpdateAction('update employeeid from 009 to EMP009');

  assert.deepEqual(result, {
    type: 'employeeIdUpdate',
    currentEmployeeId: '009',
    newEmployeeId: 'EMP009',
    source: 'command'
  });
});

test('parses name-based status command with false value', () => {
  const result = parseEmployeeStatusAction('update leo martin active status to false');

  assert.deepEqual(result, {
    type: 'statusUpdate',
    employeeId: 'LEO MARTIN',
    isActive: false,
    source: 'command'
  });
});

test('parses name-based inactive command', () => {
  const result = parseEmployeeStatusAction('change leo martin to inactive');

  assert.deepEqual(result, {
    type: 'statusUpdate',
    employeeId: 'LEO MARTIN',
    isActive: false,
    source: 'command'
  });
});

test('parses show me all the hr request', () => {
  const result = require('../agents/chatAgent').parseDataQueryAction('show me all the hr');

  assert.deepEqual(result, {
    type: 'dataQuery',
    entity: 'user',
    role: 'hr'
  });
});

test('parses show me all the users request', () => {
  const result = require('../agents/chatAgent').parseDataQueryAction('show me all the users');

  assert.deepEqual(result, {
    type: 'dataQuery',
    entity: 'user'
  });
});

test('parses show all pending leave requests', () => {
  const result = require('../agents/chatAgent').parseDataQueryAction('show all pending leave requests');

  assert.deepEqual(result, {
    type: 'dataQuery',
    entity: 'leave',
    status: 'Pending'
  });
});

test('parses show all approved leaves', () => {
  const result = require('../agents/chatAgent').parseDataQueryAction('show all approved leaves');

  assert.deepEqual(result, {
    type: 'dataQuery',
    entity: 'leave',
    status: 'Approved'
  });
});

test('parses show me all the hr', () => {
  const result = require('../agents/chatAgent').parseDataQueryAction('show me all the hr');

  assert.deepEqual(result, {
    type: 'dataQuery',
    entity: 'user',
    role: 'hr'
  });
});

test('parses active employees query', () => {
  const result = require('../agents/chatAgent').parseDataQueryAction('show all active employees');

  assert.deepEqual(result, {
    type: 'dataQuery',
    entity: 'user',
    isActive: true
  });
});

test('parses managers query', () => {
  const result = require('../agents/chatAgent').parseDataQueryAction('show all managers');

  assert.deepEqual(result, {
    type: 'dataQuery',
    entity: 'user',
    role: 'manager'
  });
});

test('parses list the users query', () => {
  const result = require('../agents/chatAgent').parseDataQueryAction('list the users');

  assert.deepEqual(result, {
    type: 'dataQuery',
    entity: 'user'
  });
});

test('parses list the leaves query', () => {
  const result = require('../agents/chatAgent').parseDataQueryAction('list the leaves');

  assert.deepEqual(result, {
    type: 'dataQuery',
    entity: 'leave'
  });
});

test('parses approve leave action', () => {
  const result = require('../agents/chatAgent').parseLeaveDecisionAction('approve leave for priya sharma');

  assert.deepEqual(result, {
    type: 'leaveDecision',
    decision: 'Approved',
    target: 'priya sharma',
    source: 'command'
  });
});

test('parses leave approval when the decision verb has a minor typo', () => {
  const result = require('../agents/chatAgent').parseLeaveDecisionAction('aprpove the leave for leo martin');

  assert.deepEqual(result, {
    type: 'leaveDecision',
    decision: 'Approved',
    target: 'leo martin',
    source: 'command'
  });
});

test('parses reject leave action', () => {
  const result = require('../agents/chatAgent').parseLeaveDecisionAction('reject leave for Leo Martin');

  assert.deepEqual(result, {
    type: 'leaveDecision',
    decision: 'Rejected',
    target: 'leo martin',
    source: 'command'
  });
});

test('parses approve leave action by employee id', () => {
  const result = require('../agents/chatAgent').parseLeaveDecisionAction('approve leave request for EMP009');

  assert.deepEqual(result, {
    type: 'leaveDecision',
    decision: 'Approved',
    target: 'emp009',
    source: 'command'
  });
});

test('parses reject leave action by employee id', () => {
  const result = require('../agents/chatAgent').parseLeaveDecisionAction('reject leave for employee id EMP010');

  assert.deepEqual(result, {
    type: 'leaveDecision',
    decision: 'Rejected',
    target: 'emp010',
    source: 'command'
  });
});

test('blocks changing an already approved leave', () => {
  const { canUpdateLeaveStatus } = require('../agents/chatAgent');

  assert.equal(canUpdateLeaveStatus('Approved', 'Rejected'), false);
  assert.equal(canUpdateLeaveStatus('Rejected', 'Approved'), false);
  assert.equal(canUpdateLeaveStatus('Pending', 'Approved'), true);
});

test('only returns user fields that differ from the database state', () => {
  const { getChangedUserUpdates } = require('../tools/userTools');

  assert.deepEqual(
    getChangedUserUpdates(
      { isActive: false, role: 'employee', department: 'department-1' },
      { isActive: false, role: 'employee', department: 'department-2' }
    ),
    { department: 'department-2' }
  );
});

test('returns null for general knowledge questions', () => {
  const result = parseEmployeeStatusAction('What is the leave policy?');

  assert.equal(result, null);
});

test('answers how-to workflow questions step by step', () => {
  const { getWorkflowHelpResponse } = require('../agents/chatAgent');

  const result = getWorkflowHelpResponse('how to create new users');

  assert.match(result, /To create a new user/);
  assert.match(result, /1\. Open User Management/);
  assert.match(result, /5\. Confirm that the new employee appears/);
});

