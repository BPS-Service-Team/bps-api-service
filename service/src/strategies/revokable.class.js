const { AuthenticationService } = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');
const ms = require('ms');

exports.RevokableAuthService = class RevokableAuthService extends AuthenticationService {
  async create(data, params) {
    const { entity, service } = this.configuration,
      { entityField, entityTarget, expiresIn } = this.configuration.refresh,
      authStrategies = params.authStrategies || this.configuration.authStrategies;

    if (!authStrategies.length) {
      throw new NotAuthenticated('No authentication strategies allowed for creating a JWT (`authStrategies`)');
    }

    let refreshTokenPayload, authResult;

    if (data.action === 'refresh' && !data.refresh_token) {
      throw new NotAuthenticated('No refresh token');
    } else if (data.action === 'refresh') {
      refreshTokenPayload = await this.verifyAccessToken(data.refresh_token, params.jwt);
      if (refreshTokenPayload.tokenType !== 'refresh') {
        throw new NotAuthenticated('Invalid token');
      }

      // Revoke the old access token
      if (params?.authentication?.accessToken) {
        await this.revokeAccessToken(params.authentication.accessToken);
      }

      let result = await this.app.service(service).get(refreshTokenPayload[entityTarget]);
      for (let key of [
        'password', 'token_expires', 'token_password', 'token',
        'pass_changed', 'pass_expires', 'pass_attempts', 'pass_history'
      ]) {
        delete result[key];
      }

      // Add rol information
      const rol = await this.app.service('roles').get(result.rol_id);
      if (rol) {
        result.rol = rol.group;
        result.rol_name = rol.name;
      }

      authResult = {
        [entity]: result,
        authentication: { strategy: data.strategy },
      };
    } else {
      authResult = await this.authenticate(data, params, ...authStrategies);
    }

    if (authResult && authResult.accessToken) {
      return authResult;
    }

    const [payload, jwtOptions] = await Promise.all([
      this.getPayload(authResult, params),
      this.getTokenOptions(authResult, params)
    ]);

    const accessToken = await this.createAccessToken(payload, jwtOptions, params.secret);

    /**
     * Generate refresh token
     */
    const refreshTokenJwtOptions = {
      ...jwtOptions,
      expiresIn,
    };

    refreshTokenPayload = {
      ...payload,
      tokenType: 'refresh',
      [entityTarget]: authResult[entity][entityField],
    };

    const refreshToken = await this.createAccessToken(refreshTokenPayload, refreshTokenJwtOptions, params.secret);

    return Object.assign({}, { accessToken, refreshToken }, authResult);
  }

  async revokeAccessToken(accessToken) {
    // First make sure the access token is valid
    const verified = await this.verifyAccessToken(accessToken),
      { expiresIn } = this.configuration.jwtOptions,
      time = ms(expiresIn) / 1000;

    await this.app.service('blacklist').create({
      token: accessToken,
      date: new Date((verified.exp - time) * 1000),
      expire_in: new Date(verified.exp * 1000),
    });

    return verified;
  }

  async verifyAccessToken(accessToken) {
    // First check if the token has been revoked
    const exist = await this.app.service('blacklist').find({
      query: {
        token: accessToken,
        $limit: 0,
      }
    });

    if (exist.total > 0) {
      throw new NotAuthenticated('The token is not valid');
    }

    return super.verifyAccessToken(accessToken);
  }

  async remove(id, params) {
    const authResult = await super.remove(id, params),
      { accessToken } = authResult,
      { ['refresh-token']: refreshToken } = params.headers;

    if (refreshToken) {
      // If there is an refresh token, revoke it
      await this.revokeAccessToken(refreshToken);
    }

    if (accessToken) {
      // If there is an access token, revoke it
      await this.revokeAccessToken(accessToken);
    }

    return authResult;
  }
};
