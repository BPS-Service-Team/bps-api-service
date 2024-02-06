const assert = require('assert');
const app = require('../../src/app');

describe("'forgot' service", () => {
  it('registered the service', () => {
    const service = app.service('forgot');

    assert.ok(service, 'Registered the service');
  });
});
