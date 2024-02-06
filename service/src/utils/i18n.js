const Mustache = require('mustache');

const LANG = process.env.CONFIG_LANG || 'es';
const translate = {
  es: {
    ability_not_allowed: 'No tienes permitido hacer "{{ action2 }}" sobre "{{ serviceName }}"',
    ability_not_permissions: 'No tienes permisos asignados',
    ability_not_role: 'No tienes un rol asignado',
    ability_var_not_defined: 'No se puede formatear la variable "{{ name }}", no está definida',
    already_related: 'No se puede eliminar {{ entity }} porque ya se encuentra relacionado a {{ collection }}',
    auth_inactive: 'El usuario se encuentra inactivo',
    auth_not_verified: 'El usuario no se ha verificado',
    default_page_not_config: 'La configuración de las páginas por defecto no están configuradas',
    forgot_already_sent: 'Ya se ha enviado un correo para reiniciar la contraseña',
    forgot_api_url: 'La URL de la API no está configurada',
    forgot_not_registered: 'El email no está registrado o está inactivo',
    forgot_not_template: 'El template de para los correos no está configurado',
    forgot_token_invalid: 'El token para reiniciar la contraseña no es válido o ha expirado',
    insert_record_success: 'Registro Insertado Correctamente',
    mail_content: 'El titulo o el contenido del correo electrónico no son válidos',
    mail_incomplete: 'La configuración de correo está incompleta',
    multimedia_empty_files: 'Favor de proporcionar las lista de archivos',
    multimedia_not_allowed: 'Solo los archivos {{ accepted }} están permitidos!',
    multimedia_not_bucket: 'No se pudo obtener la configuración del bucket',
    multimedia_not_deleted: 'No tiene permitido borrar este archivo',
    pass_expired: 'La contraseña ha expirado, favor de cambiarla',
    pass_max_attempts: 'Se ha alcanzado el número maximo de re-intentos',
    record_not_found: 'No se encontró el {{ ref_single }} con el id {{ id }}',
    register_pass_not_match: 'La contraseña y la repetición no coinciden',
    verify_invalid: 'El token de verificación de correo es invalido',
  },
  en: {
    ability_not_allowed: 'You are not allowed to "{{ action2 }}" on "{{ serviceName }}"',
    ability_not_permissions: 'You doesn\'t have a permissions assigned',
    ability_not_role: 'You doesn\'t have a role assigned',
    ability_var_not_defined: 'On role parse, the variable "{{ name }}" is not defined',
    already_related: '{{ entity }} cannot be deleted because it is already linked to {{ collection }}',
    auth_inactive: 'User is inactive',
    auth_not_verified: 'User has not been verified',
    default_page_not_config: 'The default page settings are not configured.',
    forgot_already_sent: 'An email has already been sent to reset the password',
    forgot_api_url: 'The API url isn\'t configured',
    forgot_not_registered: 'The email is not registered or is not active',
    forgot_not_template: 'The email template is not configured',
    forgot_token_invalid: 'The password reset token is invalid or has expired',
    insert_record_success: 'Insert Record Success',
    mail_content: 'The title or the content of the email is not valid',
    mail_incomplete: 'Mail settings are incomplete',
    multimedia_empty_files: 'Please provide a list of files',
    multimedia_not_allowed: 'Only {{ accepted }} files are allowed!',
    multimedia_not_bucket: 'Could not get the bucket configuration',
    multimedia_not_deleted: 'You are not allowed to delete this file',
    pass_expired: 'The password has expired, please change it',
    pass_max_attempts: 'Maximum number of retries to login has been reached',
    record_not_found: 'The {{ ref_single }} with id {{ id }} not found',
    register_pass_not_match: 'Password and repeat password do not match',
    verify_invalid: 'The email verification token is invalid',
  }
};

const selectLanguage = (key, language) => {
  if (language) {
    return translate[language][key];
  } else {
    return translate[LANG][key];
  }
};

module.exports = {
  render: (key = '', data = {}, language) => {
    return Mustache.render(
      selectLanguage(key, language),
      data
    );
  },

  labelRender: async (context, query = {}, data = false) => {
    if (!query.language) {
      query.language = {
        $in: [LANG, '*']
      };
    }
    if (!query.country) {
      query.country = '*';
    }

    let labels = await context.app.service('labels').find({
        query
      }),
      sTemplate = false,
      oLabel;

    if (labels.length) {
      oLabel = labels.find(item => item.language === LANG);
      if (!oLabel) {
        oLabel = labels.find(item => item.language === '*');
      }

      if (oLabel) {
        if (!data) {
          sTemplate = oLabel.text;
        } else {
          sTemplate = Mustache.render(oLabel.text, data);
        }
      }
    }

    return sTemplate;
  },

  single: (key = '', language) => {
    return selectLanguage(key, language);
  },
};
