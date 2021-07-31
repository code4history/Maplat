"use strict";

const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.config.common.js");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: './assets/[name].js'
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [{
        from: 'locales',
        to: './assets/locales/'
      }]
    })
  ],

  module: {
    rules: [
      {
        test: /\.(jpg|jpeg|png)$/,
        exclude: /node_modules(?![/\\](@maplat)[/\\])/,
        loader: 'file-loader',
        options: {
          outputPath: "assets/images",
          publicPath(path) {
            return `assets/images/${path}`;
          }
        }
      },
      {
        test: /\.woff$/,
        exclude: /node_modules(?![/\\](@maplat)[/\\])/,
        loader: 'file-loader',
        options: {
          outputPath: "assets/fonts",
          publicPath(path) {
            return `fonts/${path}`;
          }
        }
      }
    ]
  },
});
