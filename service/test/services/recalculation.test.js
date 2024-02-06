const assert = require('assert');
const app = require('../../src/app');

describe("'recalculation' service", () => {
  it('registered the service', () => {
    const service = app.service('recalculation');

    assert.ok(service, 'Registered the service');
  });
});
