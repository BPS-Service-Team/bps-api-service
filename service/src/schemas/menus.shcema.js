const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  rol_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().label('Rol'),
  name: Joi.string().trim().max(50).required().label('Name'),
  menus: Joi.object().keys({
    main: Joi.array().items(
      Joi.object().keys({
        text: Joi.string().trim().max(100).label('Text'),
        slug: Joi.string().trim().max(50).lowercase().label('Short name'),
        path: Joi.string().trim().max(100).lowercase().label('Path'),
        icon: Joi.string().trim().max(255).label('Icon'),
        is_divider: Joi.boolean().label('Divisor'),
        children: Joi.array().items(
          Joi.object().keys({
            text: Joi.string().trim().max(100).label('Text'),
            slug: Joi.string().trim().max(50).lowercase().label('Short name'),
            path: Joi.string().trim().max(100).lowercase().label('Path'),
            icon: Joi.string().trim().max(255).label('Icon'),
            is_divider: Joi.boolean().label('Divisor'),
            children: Joi.array().items(
              Joi.object().keys({
                text: Joi.string().trim().max(100).label('Text'),
                slug: Joi.string().trim().max(50).lowercase().label('Short name'),
                path: Joi.string().trim().max(100).lowercase().label('Path'),
                icon: Joi.string().trim().max(255).label('Icon'),
                is_divider: Joi.boolean().label('Divisor'),
              })
            ).label('Children'),
          })
        ).label('Children'),
      })
    ).label('Main'),
    panel: Joi.array().items(
      Joi.object().keys({
        text: Joi.string().trim().max(100).label('Text'),
        slug: Joi.string().trim().max(50).lowercase().label('Short name'),
        description: Joi.string().trim().max(255),
        path: Joi.string().trim().max(100).lowercase().label('Path'),
        icon: Joi.string().trim().max(255).label('Icon'),
      })
    ).label('Panel'),
  }),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  rol_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Rol'),
  name: Joi.string().trim().max(50).label('Name'),
  menus: Joi.object().keys({
    main: Joi.array().items(
      Joi.object().keys({
        text: Joi.string().trim().max(100).label('Text'),
        slug: Joi.string().trim().max(50).lowercase().label('Short name'),
        path: Joi.string().trim().max(100).lowercase().label('Path'),
        icon: Joi.string().trim().max(255).label('Icon'),
        is_divider: Joi.boolean().label('Divisor'),
        children: Joi.array().items(
          Joi.object().keys({
            text: Joi.string().trim().max(100).label('Text'),
            slug: Joi.string().trim().max(50).lowercase().label('Short name'),
            path: Joi.string().trim().max(100).lowercase().label('Path'),
            icon: Joi.string().trim().max(255).label('Icon'),
            is_divider: Joi.boolean().label('Divisor'),
            children: Joi.array().items(
              Joi.object().keys({
                text: Joi.string().trim().max(100).label('Text'),
                slug: Joi.string().trim().max(50).lowercase().label('Short name'),
                path: Joi.string().trim().max(100).lowercase().label('Path'),
                icon: Joi.string().trim().max(255).label('Icon'),
                is_divider: Joi.boolean().label('Divisor'),
              })
            ).label('Children')
          })
        ).label('Children')
      })
    ).label('Main'),
    panel: Joi.array().items(
      Joi.object().keys({
        text: Joi.string().trim().max(100).label('Text'),
        slug: Joi.string().trim().max(50).lowercase().label('Short name'),
        description: Joi.string().trim().max(255),
        path: Joi.string().trim().max(100).lowercase().label('Path'),
        icon: Joi.string().trim().max(255).label('Icon'),
      })
    ).label('Panel'),
  }),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA
};
