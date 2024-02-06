const { authenticate } = require('@feathersjs/authentication').hooks;
const moment = require('moment');
const errors = require('@feathersjs/errors');

const i18n = require('../../utils/i18n');

const emptyBucket = async function (bucket, sPath, callback, aToDelete) {
  const data = await bucket.conn.listObjectsV2({
    Bucket: bucket.config.name,
    MaxKeys: 50,
    Delimiter: '/',
    Prefix: sPath
  }).promise();

  const oParams = {
    Bucket: bucket.config.name
  };

  if (data.Contents.length > 1) {
    oParams.Delete = { Objects: [], Quiet: false };
    data.Contents.map(item => {
      if (item.Key[item.Key.length - 1] !== '/') {
        oParams.Delete.Objects.push({ Key: item.Key });
      } else if (item.Key !== sPath) {
        throw new errors.BadRequest(
          'To delete this folder, you must first delete the inside ones.',
          { label: 'API_UTILS_DELETE_INSIDE_FOLDERS' }
        );
      }
    });
  } else if (data.CommonPrefixes.length) {
    throw new errors.BadRequest(
      'To delete this folder, you must first delete the ones inside',
      { label: 'API_UTILS_DELETE_INSIDE_FOLDERS' }
    );
  } else {
    oParams.Delete = { Objects: [{ Key: sPath }], Quiet: false };
  }

  if (oParams.Delete) {
    // Ahora, borramos el registro en multimedia
    for (let oRow of oParams.Delete.Objects) {
      if (oRow.Key) {
        aToDelete.push(
          oRow.Key.substring(oRow.Key.lastIndexOf('/') + 1, oRow.Key.length)
        );
      }
    }
  }

  const result = await bucket.conn.deleteObjects(oParams).promise();

  if (data.Contents.length > result.Deleted.length) {
    await emptyBucket(bucket, sPath, callback, aToDelete);
  } else {
    callback(aToDelete);
  }
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [async context => {
      const bucket = context.app.get('bucketClient'),
        { user } = context.params,
        { action } = context.data;

      if (action) {
        if (action === 'list-directories') {
          const mongooseClient = context.app.get('mongooseClient'),
            model = mongooseClient.models['multimedia'],
            { custom_path, is_public } = context.data;

          if (bucket) {
            let sPath = !is_public ? 'users/' : 'public/';

            if (user.rol !== 'admin' && !is_public) {
              sPath += user._id.toString() + '/';
            }

            if (custom_path) {
              sPath += custom_path;
            }

            const awsResponse = await bucket.conn.listObjectsV2({
              Bucket: bucket.config.name,
              Delimiter: '/',
              Prefix: `${bucket.config.prefix}${sPath}`
            }).promise();

            let aKeys = awsResponse.Contents.map(item => item.Key.substr(item.Key.lastIndexOf('/') + 1)),
              media = aKeys.length ? await model.find({
                file_name: {
                  $in: aKeys
                }
              }).lean() : [];

            if (media.length) {
              awsResponse.Contents.map(item => {
                let sKey = item.Key.substr(item.Key.lastIndexOf('/') + 1),
                  image = media.find(row => row.file_name === sKey);

                if (image) {
                  item._id = image._id.toString();
                  item.Key = encodeURI(item.Key);
                  item.RealName = image.name;
                  item.FileType = image.file_type;
                  item.file_name = image.file_name;
                  item.file_path = image.file_path;
                }
              });
            }

            context.result = awsResponse;
          } else {
            throw new errors.BadRequest(
              i18n.single('multimedia_not_bucket'),
              { label: 'API_UTILS_MULTIMEDIA_NOT_BUCKET' }
            );
          }
        } else if (action === 'create-folder') {
          const { custom_path, is_public } = context.data;

          if (custom_path) {
            if (custom_path.trim().length === 0) {
              throw new errors.BadRequest(
                'It is not allowed to create folders with empty names.',
                { label: 'API_UTILS_NOT_ALLOWED_EMPTY_FOLDERS' }
              );
            }
          } else {
            throw new errors.BadRequest(
              'Please provide the folder name.',
              { label: 'API_UTILS_PROVIDER_FOLDER_NAME' }
            );
          }

          if (bucket) {
            let sPath = !is_public ? 'users/' : 'public/';

            if (user.rol !== 'admin' && !is_public) {
              sPath += user._id.toString() + '/';
            }

            if (custom_path) {
              sPath += custom_path;
            }

            await bucket.conn.putObject({
              Bucket: bucket.config.name,
              Key: `${bucket.config.prefix}${sPath}`
            }).promise();

            context.result = {
              result: true,
              path: sPath
            };
          }
        } else if (action === 'remove-folder') {
          const { path } = context.data;

          if (bucket) {
            let aToDelete = [];
            return emptyBucket(bucket, path, async aResult => {
              if (aResult.length) {
                await context.app.service('multimedia').remove(null, {
                  query: {
                    file_name: {
                      $in: aResult.filter(item => item !== '')
                    }
                  }
                });
              }

              context.result = {
                files_remove: aResult.length,
                result: true,
              };

              return context;
            }, aToDelete);
          }
        } else if (action === 'find-files') {
          const { path, name } = context.data,
            mongooseClient = context.app.get('mongooseClient'),
            model = mongooseClient.models['multimedia'],
            userModel = mongooseClient.models['users'],
            ObjectId = mongooseClient.Types.ObjectId;

          let query = {
              $match: {
                $and: [
                  {
                    file_path: {
                      $regex: '^' + path.replace(bucket.config.prefix, ''),
                      $options: 'i',
                    },
                  }
                ],
              }
            },
            result = {
              CommonPrefixes: [],
              Contents: [],
              Delimiter: '/',
              IsTruncated: false,
              KeyCount: 0,
              MaxKeys: 1000,
              Name: bucket.config.name,
              Prefix: path,
            },
            aUsers = [];

          if (user.rol !== 'admin') {
            query.$match.$and.push({ user_id: user._id });
          }
          query.$match.$and.push({
            name: {
              $regex: name,
              $options: 'i',
            }
          });

          const multimedias = await model.aggregate([
            query,
          ]);

          multimedias.map(item => {
            result.Contents.push({
              ETag: '',
              FileType: item.file_type,
              Key: bucket.config.prefix + item.file_path,
              LastModified: item.created_at,
              RealName: item.name,
              Size: -1,
              StorageClass: 'STANDARD',
              file_name: item.file_name,
              file_path: item.file_path,
              _id: item._id,
            });

            if (item.file_path.indexOf('users/') > -1) {
              let sTrim = item.file_path.replace('users/', ''),
                sUserId = sTrim.substr(0, sTrim.indexOf('/'));

              aUsers.push(sUserId);
            }
          });

          result.Contents.map(item => {
            item.FakePath = item.file_path.replace(item.file_name, '');
          });

          if (aUsers.length) {
            const users = await userModel.find({
              _id: {
                $in: aUsers.map(text => ObjectId(text)),
              },
            }, { _id: 1, full_name: 1 }).lean();

            users.map(single => {
              let aFind = result.Contents.filter(
                item => item.file_path.indexOf(single._id.toString()) > -1
              );

              if (aFind.length) {
                aFind.map(item => {
                  item.FakePath = item.FakePath.replace(single._id.toString(), single.full_name);
                });
              }
            });
          }

          result.KeyCount = multimedias.length;
          context.result = result;
        } else if (action === 'remove-file') {
          const { path } = context.data;

          if (!path) {
            throw new errors.BadRequest(
              'La ruta del archivo es necesaria',
              { label: 'API_UTILS_DELETE_FILE' }
            );
          }

          const multimedia = await context.app.service('multimedia').find({
            query: {
              file_path: path,
              $select: ['_id', 'file_path'],
              $limit: 1,
            }
          });

          if (multimedia.total) {
            context.result = await context.app.service('multimedia').remove(multimedia.data[0]._id, context.params);
          }
        } else if (action === 'charts-information') {
          //TODO Add charts information
          const mongooseClient = context.app.get('mongooseClient'),
            model = mongooseClient.models['orders'];
          //Obtenemos las ordenes de los últimos 30 días
          const ordersLastMonth = await model.find({
            created_at: {
              $lte: moment().endOf('day').toISOString(),
              $gte: moment().subtract(30, 'days').toISOString()
            }
          });
          const dailyGroup = {
              agv: 0,
              agf: 0,
              mixed: 0,
            },
            dates = {};
          const status = await model.aggregate([
            {
              $project: {
                _id: 1,
                status: 1
              }
            },
            {
              $group: {
                _id: '$status',
                total: {
                  $sum: 1
                }
              }
            }
          ]);
          const dateFormatted = moment().format('DD/MM/YYYY');
          for (let i = 0; i <= 30; i++) {
            const currentDate = moment()
              .subtract(30, 'days')
              .add(i, 'day')
              .format('DD/MM/YYYY');
            dates[currentDate] = 0;
          }
          for (let order of ordersLastMonth) {
            const currentDate = moment(order.created_at).format('DD/MM/YYYY');
            if (dateFormatted === currentDate) {
              if (order.agv.length > 0 && order.agf.length > 0) {
                dailyGroup.mixed++;
              } else {
                if (order.agv.length > 0) {
                  dailyGroup.agv++;
                }
                if (order.agf.length > 0) {
                  dailyGroup.agf++;
                }
              }
            }
            if (!dates[currentDate]) {
              dates[currentDate] = 1;
            } else {
              dates[currentDate]++;
            }
          }
          context.result = {
            status,
            dates,
            dailyGroup
          };
        }
      }
    }],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
