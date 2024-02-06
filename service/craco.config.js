const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');
const CracoAntDesignPlugin = require('craco-antd');
const { getThemeVariables } = require('antd/dist/theme');

module.exports = {
  plugins: [
    {
      plugin: CracoAntDesignPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              ...getThemeVariables({
                compact: true, // Enable compact mode
              }),
              '@primary-color': '#d8001e',
            },
            javascriptEnabled: true,
          },
        },
        babelPluginImportOptions: {
          libraryDirectory: 'es',
        },
      },
    },
    {
      plugin: new AntdDayjsWebpackPlugin(),
    },
  ],
};
