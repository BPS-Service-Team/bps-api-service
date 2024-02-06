const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const validate = require('@feathers-plus/validate-joi');
const errors = require('@feathersjs/errors');
const nodemailer = require('nodemailer');
const Mustache = require('mustache');
const axios = require('axios');
const fs = require('fs');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/mail.schema');
const i18n = require('../../utils/i18n');
const logger = require('../../logger');

const API_URL = process.env.API_URL || '';
const EMAIL_METHOD = process.env.EMAIL_METHOD || 'manual';

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [disallow()],
    get: [disallow()],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [async context => {
      const { data } = context,
        template = await i18n.labelRender(context, {
          slug: 'mailtemplatelbl',
          section: 'email',
          language: '*'
        });

      if (!API_URL) {
        throw new errors.BadRequest(
          i18n.single('forgot_api_url'),
          { label: 'API_FORGOT_API_URL' }
        );
      }

      if (!template) {
        throw new errors.BadRequest(
          i18n.single('forgot_not_template'),
          { label: 'API_FORGOT_NOT_TEMPLATE' }
        );
      }

      if (!data.content || !data.title) {
        throw new errors.BadRequest(
          i18n.single('mail_content'),
          { label: 'API_MAIL_CONTENT' }
        );
      }

      if (data.email) {
        let sContent = Mustache.render(template, {
          content: data.content,
          title: data.title,
          url: API_URL,
          year: new Date().getFullYear(),
        });

        if (EMAIL_METHOD === 'sendiblue') {
          let oConfig = {
            url: process.env.EMAIL_API_URL || '',
            api_key: process.env.EMAIL_API_KEY || '',
            sender_name: process.env.EMAIL_SEND_NAME || '',
            sender_email: process.env.EMAIL_SEND_EMAIL || '',
          };

          for (let sKey in oConfig) {
            if (!oConfig[sKey]) {
              throw new errors.GeneralError(
                i18n.single('mail_incomplete')
              );
            }
          }

          let oLog = {
            from: oConfig.sender_email,
            reference_id: data.reference_id,
            reference_type: data.reference_type,
            subject: data.title,
            to: []
          };

          let aToEmails = [];
          if (typeof data.email === 'string') {
            aToEmails.push({
              email: data.email
            });

            oLog.to.push(data.email);
          } else if (Array.isArray(data.email)) {
            data.email.map(item => {
              if (!aToEmails.find(single => single.to === item)) {
                aToEmails.push({
                  email: item
                });

                oLog.to.push(item);
              }
            });
          }

          return axios({
            method: 'POST',
            url: oConfig.url,
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json',
              'api-key': oConfig.api_key,
            },
            data: JSON.stringify({
              sender: {
                name: oConfig.sender_name,
                email: oConfig.sender_email
              },
              to: aToEmails,
              htmlContent: sContent,
              subject: data.title,
            }),
          }).then(response => {
            context.app.service('email-logs').create({
              ...oLog,
              to: oLog.to.join(','),
              message_id: response.data.messageId,
              status: 1
            });
          }).catch(error => {
            context.app.service('email-logs').create({
              ...oLog,
              to: oLog.to.join(','),
              result: error.message || error,
              status: 0
            });
          });
        } else {
          let oConfig = {
            pool: true,
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || 465, 10),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
              name: process.env.EMAIL_SEND_NAME,
              user: process.env.EMAIL_SEND_EMAIL,
              pass: process.env.EMAIL_SEND_PASSWORD,
            }
          };

          let oLog = {
            from: oConfig.auth.user,
            reference_id: data.reference_id,
            reference_type: data.reference_type,
            subject: data.title,
            to: '',
            status: 0,
          };

          let aToEmails = [];
          if (typeof data.email === 'string') {
            aToEmails.push(data.email);
          } else if (Array.isArray(data.email)) {
            data.email.map(item => {
              aToEmails.push(item);
            });
          }

          const sListEmails = aToEmails.join(',');
          // Create reusable transporter object using the default SMTP transport
          let oTransporter = nodemailer.createTransport(oConfig),
            oMessage = {
              from: `${oConfig.auth.name} <${oConfig.auth.user}>`,
              to: sListEmails,
              subject: data.title,
              html: sContent,
              headers: {
                'contentType': 'text/html',
                'charset': 'UTF-8'
              }
            };

          if (data.extra_data) {
            if (data.extra_data.path) {
              oMessage.attachments = [{
                filename: data.extra_data.file_name,
                content: fs.createReadStream(data.extra_data.path),
              }];
            }
          }

          // Send the email
          oTransporter.sendMail(oMessage, async (err, info) => {
            try {
              oLog.to = sListEmails;

              if (err) {
                oLog.result = err.message || err;
              } else {
                oLog.status = 1;
                oLog.message_id = info.messageId || info.response;
              }

              await context.app.service('email-logs').create(oLog);
            } catch (err2) {
              logger.error('[POST /mail] Error: %s', err2.message || (typeof err2 === 'string' ? err2 : JSON.stringify(err2)));
            }
          });
        }
      }
    }],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
