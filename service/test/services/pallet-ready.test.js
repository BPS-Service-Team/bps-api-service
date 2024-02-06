const assert = require('assert');
const app = require('../../src/app');

describe("'pallet-ready' service", () => {
  it('registered the service', () => {
    const service = app.service('pallet-ready');

    assert.ok(service, 'Registered the service');
  });
});
