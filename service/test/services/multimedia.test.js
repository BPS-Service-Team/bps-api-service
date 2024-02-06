const assert = require('assert');
const app = require('../../src/app');

describe("'multimedia' service", () => {
  it('registered the service', () => {
    const service = app.service('multimedia');

    assert.ok(service, 'Registered the service');
  });
});
