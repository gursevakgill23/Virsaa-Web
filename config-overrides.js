const path = require('path');

module.exports = function override(config) {
  config.module.rules.push({
    test: /pdf\.worker\.(min\.)?js$/,
    include: path.resolve(__dirname, 'node_modules/pdfjs-dist/build'),
    use: {
      loader: 'file-loader',
      options: {
        name: 'static/js/[name].[contenthash].js',
      },
    },
  });

  return config;
};