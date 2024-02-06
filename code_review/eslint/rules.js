const baseConfig = require('./.eslintrc.js');

baseConfig.extends.push('plugin:diff/staged');

baseConfig.plugins.push('diff');

baseConfig.processor = 'diff/staged';

module.exports = baseConfig;
