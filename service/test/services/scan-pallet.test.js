const assert = require('assert');
const app = require('../../src/app');

describe('\'scan-pallet\' service', () => {
  it('registered the service', () => {
    const service = app.service('scan-pallet');

    assert.ok(service, 'Registered the service');
  });
});
