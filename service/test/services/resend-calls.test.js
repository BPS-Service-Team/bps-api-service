const assert = require('assert');
const app = require('../../src/app');

describe('\'resend-calls\' service', () => {
  it('registered the service', () => {
    const service = app.service('resend-calls');

    assert.ok(service, 'Registered the service');
  });
});
