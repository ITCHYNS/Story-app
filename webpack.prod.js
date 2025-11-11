// webpack.prod.js
const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// 1. Impor InjectManifest 
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),

    // 2. Tambahkan skrip InjectManifest 
    new InjectManifest({
      swSrc: path.resolve(__dirname, "./src/sw.js"),
      swDest: "sw.bundle.js", // Ini akan membuat file sw.bundle.js
    }),
  ],
});