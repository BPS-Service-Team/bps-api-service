const assert = require('assert');
const app = require('../../src/app');

describe("'blacklist' service", () => {
  it('registered the service', () => {
    const service = app.service('blacklist');

    assert.ok(service, 'Registered the service');
  });
});
