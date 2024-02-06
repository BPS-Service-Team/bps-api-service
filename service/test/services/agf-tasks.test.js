const assert = require('assert');
const app = require('../../src/app');

describe('\'agf-tasks\' service', () => {
  it('registered the service', () => {
    const service = app.service('agf-tasks');

    assert.ok(service, 'Registered the service');
  });
});
