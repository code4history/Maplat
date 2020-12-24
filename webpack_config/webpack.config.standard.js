"use strict";

const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
  entry: {
    "maplat": path.resolve(__dirname, "../tmpl/web-bridge.js")
  },

  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: '[name].js'
  },
});
