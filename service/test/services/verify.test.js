const assert = require('assert');
const app = require('../../src/app');

describe("'verify' service", () => {
  it('registered the service', () => {
    const service = app.service('verify');

    assert.ok(service, 'Registered the service');
  });
});
