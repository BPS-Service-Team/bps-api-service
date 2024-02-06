const assert = require('assert');
const app = require('../../src/app');

describe('\'relocation-ready\' service', () => {
  it('registered the service', () => {
    const service = app.service('relocation-ready');

    assert.ok(service, 'Registered the service');
  });
});
