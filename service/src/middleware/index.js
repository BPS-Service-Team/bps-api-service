const Util = require('../utils');

// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  // Add your custom middleware here. Remember that
  // in Express, the order matters.
  app.use('*', (req, res, next) => {
    req.feathers.ip = Util.getClientIP(req);
    req.feathers.user_agent = req.useragent;

    next();
  });
};
