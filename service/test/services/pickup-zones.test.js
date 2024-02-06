const assert = require('assert');
const app = require('../../src/app');

describe("'pickup-zones' service", () => {
  it('registered the service', () => {
    const service = app.service('workstations');

    assert.ok(service, 'Registered the service');
  });
});
