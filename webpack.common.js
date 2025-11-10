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

    // --- BAGIAN YANG DIPERBARUI ---
    new CopyWebpackPlugin({
      patterns: [
        {
          // Tetap salin folder public (jika ada isinya)
          from: path.resolve(__dirname, 'src/public/'),
          to: path.resolve(__dirname, 'dist/'),
        },
        {
          // Ubah 'src/manifest.json' menjadi 'manifest.json' (root)
          from: path.resolve(__dirname, 'manifest.json'),
          to: path.resolve(__dirname, 'dist/'),
        },
        {
          // Ubah 'src/sw.js' menjadi 'sw.js' (root)
          from: path.resolve(__dirname, 'sw.js'),
          to: path.resolve(__dirname, 'dist/'),
        },
        {
          // TAMBAHAN: Salin 'icon-256.png' dari root
          from: path.resolve(__dirname, 'icon-256.png'),
          to: path.resolve(__dirname, 'dist/'),
        },
        {
          // TAMBAHAN: Salin 'favicon.png' dari root
          from: path.resolve(__dirname, 'favicon.png'),
          to: path.resolve(__dirname, 'dist/'),
        }
      ],
    }),
    // --- AKHIR BAGIAN YANG DIPERBARUI ---
  ],
};