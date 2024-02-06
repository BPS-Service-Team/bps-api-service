const assert = require('assert');
const app = require('../../src/app');

describe("'export-collections' service", () => {
  it('registered the service', () => {
    const service = app.service('export-collections');

    assert.ok(service, 'Registered the service');
  });
});
