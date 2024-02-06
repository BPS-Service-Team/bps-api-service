const assert = require('assert');
const app = require('../../src/app');

describe("'agvs' service", () => {
  it('registered the service', () => {
    const service = app.service('agvs');

    assert.ok(service, 'Registered the service');
  });
});
