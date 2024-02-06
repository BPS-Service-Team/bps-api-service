module.exports = function (app) {
  if (typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return;
  }

  app.on('connection', connection => {
    // On a new real-time connection, add it to the anonymous channel
    app.channel('anonymous').join(connection);
  });

  app.on('login', async (_, params, context) => {
    const { connection } = params;

    // connection can be undefined if there is no
    // real-time connection, e.g. when logging in via REST
    if (connection) {
      // Obtain the logged in user from the connection
      const { user } = connection;

      // The connection is no longer anonymous, remove it
      app.channel('anonymous').leave(connection);

      // Add it to the authenticated user channel
      app.channel('authenticated').join(connection);

      // E.g. to send real-time events only to admins use
      if (user.rol === 'admin') {
        app.channel('robots').join(connection);
      }
    }
  });

  app.service('agfs').publish('patched', async (result, context) => {
    const { code } = context.data,
      { $send_notification } = context.params;

    if (code && $send_notification) {
      return [
        app.channel('robots').send({
          _id: result._id,
          code: result.code,
          status: result.status,
          message_code: result.message_code,
        }),
      ];
    }
  });
};
