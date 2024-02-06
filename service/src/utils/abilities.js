const { AbilityBuilder, Ability } = require('@casl/ability');
const { toMongoQuery } = require('@casl/mongoose');
const i18n = require('./i18n');

const errors = require('@feathersjs/errors');
const getByPath = require('lodash.get');
const TYPE_KEY = Symbol.for('type');

function subjectName(subject) {
  if (!subject || typeof subject === 'string') {
    return subject;
  }

  return subject[TYPE_KEY];
}

function parseJSON(template, variables) {
  return JSON.parse(template, (key, rawValue) => {
    if (rawValue[0] !== '$') {
      return rawValue;
    }

    const name = rawValue.slice(2, -1);
    const value = getByPath(variables, name);

    if (typeof value === 'undefined') {
      throw new errors.BadRequest(
        i18n.render('ability_var_not_defined', { name })
      );
    }

    return value;
  });
}

function defineAbilitiesFor(user, role, params) {
  const { can, rules } = new AbilityBuilder(Ability);

  if (user) {
    if (role) {
      const { permissions } = role;

      if (permissions) {
        // If it has permissions assigned, we configure each with the "can" function
        permissions.map(row => {
          // Both actions and subject, accept both a simple string and an array
          const { actions, subject, conditions } = row;

          if (conditions !== undefined) {
            let oParse = parseJSON(JSON.stringify(conditions), params);
            can(actions, subject, oParse);
          } else {
            can(actions, subject);
          }
        });
      } else {
        throw new errors.Forbidden(
          i18n.single('ability_not_permissions')
        );
      }
    } else {
      throw new errors.Forbidden(
        i18n.single('ability_not_role')
      );
    }
  }

  return new Ability(rules, { subjectName });
}

function canReadQuery(query) {
  return query !== null;
}

module.exports = async function authorize(hook) {
  const action = hook.method;
  const service = hook.service;
  const serviceName = hook.path;
  let { user } = hook.params, rol;

  if (user) {
    rol = await hook.app.service('roles').get(user.rol_id);
    hook.params.user.rol = rol.group;
    hook.params.user.rol_name = rol.name;
  }

  const ability = defineAbilitiesFor(user, rol, hook.params);
  const throwUnlessCan = (action2, resource) => {
    if (ability.cannot(action2, resource)) {
      throw new errors.Forbidden(
        i18n.render('ability_not_allowed', { action2, serviceName })
      );
    }
  };

  hook.params.ability = ability;

  if (hook.method === 'create') {
    hook.data[TYPE_KEY] = serviceName;
    throwUnlessCan('create', hook.data);
  }

  if (!hook.id) {
    const query = toMongoQuery(ability, serviceName, action);

    if (canReadQuery(query)) {
      Object.assign(hook.params.query, query);
    } else {
      throw new errors.Forbidden(
        i18n.render('ability_not_allowed', { action2: action, serviceName })
      );
    }

    return hook;
  }

  const params = Object.assign({}, hook.params, { provider: null });
  const result = await service.get(hook.id, params);

  result[TYPE_KEY] = serviceName;
  throwUnlessCan(action, result);
  hook.params.$element = result;

  return hook;
};
