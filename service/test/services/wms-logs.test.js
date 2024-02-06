const assert = require('assert');
const app = require('../../src/app');

describe("'wms-logs' service", () => {
  it('registered the service', () => {
    const service = app.service('wms-logs');

    assert.ok(service, 'Registered the service');
  });
});
