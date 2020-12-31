"use strict";

const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
  entry: {
    "maplat": path.resolve(__dirname, "../tmpl/web-bridge_packed.js")
  },

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
