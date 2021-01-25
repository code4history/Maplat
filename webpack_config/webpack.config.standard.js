"use strict";

const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.(jpg|jpeg|png)$/,
        exclude: /node_modules(?![/\\](@maplat)[/\\])/,
        loader: 'file-loader',
        options: {
          outputPath: "images",
          /*publicPath(path) {
            return path;
            //return `dist/${path}`;
          }*/
        }
      },
      {
        test: /\.woff$/,
        exclude: /node_modules(?![/\\](@maplat)[/\\])/,
        loader: 'file-loader',
        options: {
          outputPath: "fonts"
        }
      }
    ]
  },
});
