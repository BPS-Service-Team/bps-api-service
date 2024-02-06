const assert = require('assert');
const app = require('../../src/app');

describe("'import-csv' service", () => {
  it('registered the service', () => {
    const service = app.service('import-csv');

    assert.ok(service, 'Registered the service');
  });
});
