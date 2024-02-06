const assert = require('assert');
const app = require('../../src/app');

describe('\'agv-tasks\' service', () => {
  it('registered the service', () => {
    const service = app.service('agv-tasks');

    assert.ok(service, 'Registered the service');
  });
});
