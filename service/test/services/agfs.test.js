const assert = require('assert');
const app = require('../../src/app');

describe('\'agfs\' service', () => {
  it('registered the service', () => {
    const service = app.service('agfs');

    assert.ok(service, 'Registered the service');
  });
});
