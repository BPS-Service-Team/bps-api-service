const aws = require('aws-sdk');
const logger = require('./logger');

module.exports = async app => {
  try {
    let oBucketCng = {
        key: process.env.S3_ACCESS_KEY_ID || '',
        secret: process.env.S3_SECRET_ACCESS_KEY || '',
        endpoint: process.env.S3_ENDPOINT || '',
        url: process.env.S3_BUCKET_URL || '',
        name: process.env.S3_BUCKET || ''
      },
      blnHaveConfig = true;

    for (let sKey in oBucketCng) {
      if (!oBucketCng[sKey]) {
        blnHaveConfig = false;
        logger.error('[bucket] Configuration for the connection to the bucket is incomplete');
        break;
      }
    }

    oBucketCng.prefix = process.env.S3_BUCKET_PREFIX || '';

    if (blnHaveConfig) {
      // Use our env vars for setting credentials.
      // Remove lines 11-14 if using ~/.aws/credentials file on a local server.
      aws.config.update({
        accessKeyId: oBucketCng.key,
        secretAccessKey: oBucketCng.secret,
        s3ForcePathStyle: true,
      });

      // Set S3 endpoint to DigitalOcean Spaces
      const spacesEndpoint = new aws.Endpoint(oBucketCng.endpoint);
      const s3 = new aws.S3({
        endpoint: spacesEndpoint,
        s3ForcePathStyle: true,
      });

      app.set('bucketClient', { conn: s3, config: oBucketCng });
    }
  } catch (err) {
    logger.error('[bucket] Error: ', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
  }
};
