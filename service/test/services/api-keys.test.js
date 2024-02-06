const assert = require('assert');
const app = require('../../src/app');

describe("'api-keys' service", () => {
  it('registered the service', () => {
    const service = app.service('api-keys');

    assert.ok(service, 'Registered the service');
  });
});
