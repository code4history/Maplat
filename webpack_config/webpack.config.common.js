"use strict";

const { BannerPlugin } = require('webpack');
const pjson = require('../package.json');

module.exports = {
  mode: 'production',
  devtool: 'source-map',

  plugins: [
    new BannerPlugin({
      banner: `${pjson.name} v${pjson.version} | ${pjson.author} | license: ${pjson.license}`
    })
  ],
  externals: [
    { mapboxgl: "mapboxgl" }
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules(?!\/(@maplat|swiper|dom7)\/)/,
        loader: 'babel-loader',
      }
    ]
  },
};
