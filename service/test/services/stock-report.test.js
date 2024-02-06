const assert = require('assert');
const app = require('../../src/app');

describe("'stock-report' service", () => {
  it('registered the service', () => {
    const service = app.service('stock-report');

    assert.ok(service, 'Registered the service');
  });
});
