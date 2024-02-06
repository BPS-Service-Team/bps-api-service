const assert = require('assert');
const app = require('../../src/app');

describe("'test-notify' service", () => {
  it('registered the service', () => {
    const service = app.service('test-notify');

    assert.ok(service, 'Registered the service');
  });
});
