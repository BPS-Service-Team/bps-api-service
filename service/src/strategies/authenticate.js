const { authenticate } = require('@feathersjs/authentication').hooks;
const verifyIdentity = authenticate('jwt');
const verifyIdentityAK = authenticate('api-key');

module.exports = async function Authenticate(hook) {
  if (!hook.params.user) {
    if (hook.params.headers && hook.params.headers['x-api-key']) {
      await verifyIdentityAK(hook);

      // Get authentication config
      const config = hook.app.get('authentication'),
        apiKey = config['api-key'];

      if (apiKey) {
        const entity = hook.params[apiKey['entity']];

        if (entity) {
          hook.params.user = await hook.app
            .service('users')
            .get(entity.user_id);

          if (entity.rol_id) {
            hook.params.user.rol_id = entity.rol_id;
          }
        }
      }
    } else {
      await verifyIdentity(hook);
    }
  }

  return hook;
};
