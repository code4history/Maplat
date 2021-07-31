/* eslint-disable @typescript-eslint/no-var-requires */
"use strict";

const path = require("path");
const { merge } = require("webpack-merge");
const prod = require("./webpack.config.packed.js");

module.exports = merge(prod, {
  output: {
    path: path.resolve(__dirname, "../dev_packed"),
    filename: './assets/[name].js'
  },
});