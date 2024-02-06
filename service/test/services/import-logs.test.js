const assert = require('assert');
const app = require('../../src/app');

describe("'import-logs' service", () => {
  it('registered the service', () => {
    const service = app.service('import-logs');

    assert.ok(service, 'Registered the service');
  });
});
