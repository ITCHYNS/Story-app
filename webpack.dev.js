const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  devServer: {
    // --- INI BAGIAN YANG DIPERBARUI ---
    // Kita ubah 'static' menjadi array.
    // Server sekarang akan menyajikan file dari 'dist' DAN
    // file dari root proyek (seperti sw.js dan manifest.json).
    static: [
      path.resolve(__dirname, 'dist'), // Menyajikan bundle app Anda
      path.resolve(__dirname),         // Menyajikan sw.js, manifest.json, dll.
    ],
    // -----------------------------------
    port: 9000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
  },
});