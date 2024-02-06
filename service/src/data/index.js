const bcryptjs = require('bcryptjs');
const Mustache = require('mustache');

const Utils = require('../utils');
const logger = require('../logger');
const stocks = require('./stocks');

const ADMIN_USER = process.env.CONFIG_ADMIN_USER || 'alberto.salas@obsidiansoft.io';
const HASH_SIZE = process.env.CONFIG_HASH_SIZE || 10;

/* eslint-disable */
const template = [
  '<p>Roles:</p>',
  '<pre>',
    '{{ #roles }}',
      '{{ group }} - {{ name }}\n',
    '{{ /roles }}',
  '</pre>',
  '<p>Usuarios:</p>',
  '<pre>',
    '{{ #users }}',
      '{{ email }} / {{ password }}\n',
    '{{ /users }}',
  '</pre>',
  '<p>API Keys:</p>',
  '<pre>',
    '{{ #api_keys }}',
      '{{ project_name }} - {{ api_key }}\n',
    '{{ /api_keys }}',
  '</pre>',
  '<p>Etiquetas:</p>',
  '<pre>',
    '{{ #labels }}',
      '{{ slug }}, ',
    '{{ /labels }}',
  '</pre>',
].join('');
/* eslint-enable */

const initial_data = {
  roles: [
    {
      home: '/',
      status: 1,
      group: 'admin',
      name: 'Admin Users',
      permissions: [
        {
          actions: ['manage'],
          subject: ['all'],
        },
      ],
    },
    {
      home: '/',
      status: 1,
      group: 'normal',
      name: 'Normal User',
      permissions: [
        {
          actions: ['manage'],
          subject: ['all'],
        },
      ],
    },
    {
      home: '/',
      status: 1,
      group: 'external',
      name: 'External',
      permissions: [
        {
          actions: ['manage'],
          subject: ['all'],
        },
      ],
    },
    {
      home: '/',
      status: 1,
      group: 'open-endpoints',
      name: 'Open API Endpoints',
      permissions: [
        {
          actions: ['get'],
          subject: ['forgot', 'config'],
        },
        {
          actions: ['find'],
          subject: ['version'],
        },
        {
          actions: ['patch'],
          subject: ['forgot'],
        },
        {
          actions: ['create'],
          subject: ['forgot', 'users', 'verify'],
        },
      ],
    },
  ],
  users: [
    {
      rol_id: 'admin',
      email: ADMIN_USER,
      full_name: 'Admin User',
      country: 'CN',
      flag_otp: true,
      status: 1,
    },
    {
      rol_id: 'open-endpoints',
      email: 'web.api@obsidiansoft.io',
      full_name: 'Web API Test',
      country: 'MX',
      flag_otp: true,
      status: 1,
    },
  ],
  labels: [
    {
      slug: 'forgotemailcontentlbl',
      text: '<p>You have requested the password reset, please click on the following link to continue <strong><a href="{{ link }}">Click here</a></strong></p>',
      section: 'email',
      language: '*',
      country: '*',
    },
    {
      slug: 'forgotemailtitlelbl',
      text: 'Password Reset',
      section: 'email',
      language: '*',
      country: '*',
    },
    {
      slug: 'forgotemailtitlelbl',
      text: 'Reinicio de contraseña',
      section: 'email',
      language: 'es',
      country: '*',
    },
    {
      slug: 'forgotemailcontentlbl',
      text: '<p>Ha solicitado el reinicio de su contraseña, por favor de clic en la siguiente liga para continuar <strong><a href="{{ link }}">Clic aquí</a></strong></p>',
      section: 'email',
      language: 'es',
      country: '*',
    },
    {
      slug: 'verifyemailcontentlbl',
      text: '<h1>Welcome</h1><p>Confirm that this email has reached you, so that you can start enjoying the benefits of the "Nordos" platform.</p><a href="{{ link }}">Verify your email</a>',
      section: 'email',
      language: '*',
      country: '*',
    },
    {
      slug: 'verifyemailcontentlbl',
      text: '<h1>Bienvenido</h1><p>Confirma que este correo te ha llegado, para que comiences a disfrutar de los beneficios de la plataforma de "Nordos".</p><a href="{{ link }}">Verifica tu correo</a>',
      section: 'email',
      language: 'es',
      country: '*',
    },
    {
      slug: 'verifyemailtitlelbl',
      text: 'Verify your email',
      section: 'email',
      language: '*',
      country: '*',
    },
    {
      slug: 'verifyemailtitlelbl',
      text: 'Verifica tu correo',
      section: 'email',
      language: 'es',
      country: '*',
    },
    {
      slug: 'mailtemplatelbl',
      text: '<table align="center" border="0" cellpadding="0" cellspacing="0" border="1" style="width: 100%; max-width: 600px;background: #FFFFFF;"><tr><td align="center" style="padding: 13px;"><img src="{{ url }}/logo.png" alt="logo" style="width: 150px;"></td></tr><tr><td style="background: #FF1520;"><p style="color: #FFF;font-size: 28px;font-weight: bold;letter-spacing: 1px; padding-left: 20px;padding-right: 20px;line-height: 35px;">{{{ title }}}</p></td></tr><tr><td><table border="0" width="100%" align="center" style="padding-top: 24px; padding-left: 18px; padding-right: 18px;padding-bottom: 24px; background-color: #EBEBEB; color: #1C2232;"><tr><td style="line-height: 28px; font-size: 22px; font-weight: 300;">{{{ content }}}</td></tr></table></td></tr><tr><td style="background: #FF1520;"><p style="color: #1C2232;opacity: 0.5;font-size: 12px;padding: 15px 0;text-align: center;text-decoration: none;">{{ year }} &copy; powerby <a style="text-decoration: none;" href="https://obsidiansoft.io/" target="_blank">Obsidian Soft</a></p></td></tr></table>',
      section: 'email',
      language: '*',
      country: '*',
    },
  ],
  api_keys: [
    {
      status: 1,
      user_id: 'web.api@obsidiansoft.io',
      project_name: 'Web Open Endpoints',
      api_key: '',
    },
    {
      status: 1,
      rol_id: 'external',
      user_id: 'web.api@obsidiansoft.io',
      project_name: 'For External API Endpoints',
      api_key: '',
    },
  ],
  configurations: [
    {
      name: 'Default configuration pages',
      slug: 'default-pages',
      elements: [
        {
          sort: 0,
          name: 'Forgot web page',
          slug: 'forgot-page',
          type: 'text',
          value: 'forgot.html',
        },
        {
          sort: 0,
          name: 'Verify web page',
          slug: 'verify-page',
          type: 'text',
          value: 'verify.html',
        },
        {
          sort: 0,
          name: 'Web site',
          slug: 'website',
          type: 'text',
          value: 'http://localhost:3030',
        },
      ],
    },
  ],
  stocks,
};

module.exports = {
  init: async (app, mongoose) => {
    try {
      // Check if exists some document into the user collection
      const mdlUser = mongoose.models.users;

      if (mdlUser) {
        const count = await mdlUser.countDocuments({});

        let results = {}, copy = [];
        if (count === 0) {
          for (let key in initial_data) {
            const data = initial_data[key],
              model = mongoose.models[key];

            if (data && model) {
              if (['labels', 'roles', 'configurations', 'stocks'].indexOf(key) > -1) {
                if (results.users) {
                  let user_id = results.users.find(
                    (user) => user.email === ADMIN_USER
                  )?._id;

                  for (let single of data) {
                    single.created_by = user_id;
                  }
                }

                results[key] = await model.insertMany(data);
              } else if (key === 'users') {
                for (let i = 0; i < data.length; i++) {
                  let item = data[i];

                  item.rol_id = results?.roles.find(
                    (rol) => rol.group === item.rol_id
                  )?._id;
                  item.password = Utils.getRandomCode(12, true);
                  copy.push({
                    ...item,
                  });
                  item.password = await bcryptjs.hash(
                    item.password,
                    parseInt(HASH_SIZE, 10)
                  );
                }

                results[key] = await model.insertMany(data);
                for (let i = 0; i < results[key].length; i++) {
                  results[key][i].password = copy.find(
                    (temp) => temp.email === results[key][i].email
                  )?.password;
                }
              } else if (key === 'api_keys') {
                for (let i = 0; i < data.length; i++) {
                  let item = data[i];

                  item.user_id = results?.users.find(
                    (user) => user.email === item.user_id
                  )?._id;
                  item.rol_id = results?.roles.find(
                    (rol) => rol.group === item.rol_id
                  )?._id;
                  item.api_key = await Utils.generateToken({ byteLength: 32 });
                }

                results[key] = await model.insertMany(data);
              }
            }
          }

          if (Object.keys(results).length) {
            const data = {};
            for (let key in results) {
              data[key] = [];

              for (let i = 0; i < results[key].length; i++) {
                data[key].push(results[key][i].toObject());
              }
            }

            app.service('mail').create({
              content: Mustache.render(template, data),
              title: 'Resumen de corrida de datos Iniciales',
              email: ADMIN_USER,
              reference_type: 'initial_data',
            });
          }
        }
      }
    } catch (err) {
      logger.error('[initialData] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
    }
  },
};
