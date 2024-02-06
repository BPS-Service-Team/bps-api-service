const assert = require('assert');
const app = require('../../src/app');

describe("'agv-ready' service", () => {
  it('registered the service', () => {
    const service = app.service('agv-ready');

    assert.ok(service, 'Registered the service');
  });
});
