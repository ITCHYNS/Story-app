// webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      meta: {
        'theme-color': '#2563eb',
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
      }
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          // Ini sudah benar, akan menyalin ikon-ikon Anda
          from: path.resolve(__dirname, 'src/public/'),
          to: path.resolve(__dirname, 'dist/'),
        },
        {
          // Ini sudah benar
          from: path.resolve(__dirname, 'src/manifest.json'),
          to: path.resolve(__dirname, 'dist/'),
        },
        {
          // Ini sudah benar
          from: path.resolve(__dirname, 'src/sw.js'),
          to: path.resolve(__dirname, 'dist/'),
        }
      ],
    }),
  ],
};