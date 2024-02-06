const assert = require('assert');
const app = require('../../src/app');

describe("'email-logs' service", () => {
  it('registered the service', () => {
    const service = app.service('email-logs');

    assert.ok(service, 'Registered the service');
  });
});
