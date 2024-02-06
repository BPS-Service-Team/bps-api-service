const assert = require('assert');
const app = require('../../src/app');

describe("'push-logs' service", () => {
  it('registered the service', () => {
    const service = app.service('push-logs');

    assert.ok(service, 'Registered the service');
  });
});
