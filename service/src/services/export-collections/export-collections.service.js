// Initializes the `export-collections` service on path `/export-collections`
const { ExportCollections } = require('./export-collections.class');
const hooks = require('./export-collections.hooks');
const moment = require('moment');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use(
    '/export-collections',
    new ExportCollections(options, app),
    async (req, res, next) => {
      const { method } = req,
        { data, id } = res.data;

      if (method === 'GET') {
        let oDate = moment(),
          sDate = oDate.format('YYYY-MM-DD');

        res.set('Content-disposition', `attachment; filename=${id}_${sDate}.json`);
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(data));
      } else {
        next();
      }
    },
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('export-collections');

  service.hooks(hooks);
};
