const { expressOauth } = require('@feathersjs/authentication-oauth');
const { ApiKeyStrategy } = require('@thesinding/authentication-api-key');

const { CustomLocalStrategy } = require('./strategies/local.class');
const { RevokableAuthService } = require('./strategies/revokable.class');
const { CustomJwtStrategy } = require('./strategies/jwt.class');

module.exports = app => {
  const authentication = new RevokableAuthService(app);

  authentication.register('jwt', new CustomJwtStrategy());
  authentication.register('local', new CustomLocalStrategy());
  authentication.register('api-key', new ApiKeyStrategy());

  app.use('/auth', authentication);
  app.configure(expressOauth());
};
