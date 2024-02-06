const assert = require('assert');
const app = require('../../src/app');

describe("'utils' service", () => {
  it('registered the service', () => {
    const service = app.service('utils');

    assert.ok(service, 'Registered the service');
  });
});
