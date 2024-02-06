const fs = require('fs').promises;
const path = require('path');
const prettier = require('prettier');
const moment = require('moment');

function replaceVar(str, varName, content) {
  //Remove $DATE helper
  str = str.replace(/"\$DATE/g, '').replace(/\$DATE"/g, '');
  return str.replace(`{{${varName}}}`, content);
}
function parseDocuments(data = []) {
  const DATE_FIELDS = [
    'created_at',
    'updated_at',
    'token_expires',
    'pass_changed',
    'pass_expires',
  ];
  let records = [];
  for (let item of data) {
    let tmpItm = {
      ...item,
      _id: undefined,
      created_by: undefined,
      updated_by: undefined,
    };
    for (let field of DATE_FIELDS) {
      if (typeof tmpItm[field] !== 'undefined') {
        tmpItm[field] = `$DATEnew Date('${moment(
          tmpItm[field]
        ).toISOString()}')$DATE`;
      }
    }
    if (typeof tmpItm.stocks !== 'undefined') {
      let tmpStocks = [];
      for (let s of tmpItm.stocks) {
        tmpStocks.push({
          ...s,
          DATE: `$DATEnew Date('${moment(s.DATE).toISOString()}')$DATE`,
          _id: undefined,
        });
      }
      tmpItm.stocks = tmpStocks;
    }
    if (typeof tmpItm.details !== 'undefined') {
      let tmpRecords = [];
      for (let s of tmpItm.details) {
        tmpRecords.push({
          ...s,
          _id: undefined,
        });
      }
      tmpItm.details = tmpRecords;

    }
    records.push(tmpItm);
  }
  return records;
}
async function generateMongoInit(dbclient) {
  const TARGETS = [
    'roles',
    'users',
    'labels',
    'api_keys',
    'configurations',
    'stocks',
    'orders',
    'agfs',
    'pickup_zones',
    'items',
    'wmsLogs',
    'transactions',
  ];
  const templateFile = await fs.readFile(
    path.join(__dirname, '..', 'templates', 'mongo-init.template')
  );
  let contentFile = templateFile.toString();

  for (let target of TARGETS) {
    let query = {};
    if (target === 'wmsLogs' || target === 'transactions') {
      const date = moment().subtract(30, 'days');
      query = {
        created_at: {
          $gte: date.toISOString(),
        },
      };
    }
    let records = await dbclient.models[target].find(query).lean();
    contentFile = replaceVar(
      contentFile,
      target,
      JSON.stringify(parseDocuments(records))
    );
  }
  return prettier.format(contentFile, { parser: 'babel' });
}

module.exports = {
  generateMongoInit,
};
