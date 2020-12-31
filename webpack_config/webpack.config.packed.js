"use strict";

const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
  output: {
    path: path.resolve(__dirname, "../dist_packed"),
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.(jpg|jpeg|png|woff)$/,
        exclude: /node_modules(?![/\\](@maplat)[/\\])/,
        loader: 'url-loader',
      },
    ]
  },
});
