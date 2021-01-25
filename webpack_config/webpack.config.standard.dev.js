/* eslint-disable @typescript-eslint/no-var-requires */
"use strict";

const path = require("path");
const { merge } = require("webpack-merge");
const prod = require("./webpack.config.standard.js");

module.exports = merge(prod, {
  output: {
    path: path.resolve(__dirname, "../dev"),
    filename: './assets/[name].js',
  }
});