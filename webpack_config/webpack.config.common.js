"use strict";

const path = require("path");
const { BannerPlugin } = require('webpack');
const pjson = require('../package.json');

const port = process.env.PORT || 8888;

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
        exclude: /node_modules(?![\/\\](@maplat|swiper|dom7|weiwudi)[\/\\])/,
        loader: 'babel-loader',
      }
    ]
  },

  devServer: {
    host: "0.0.0.0",
    public: `localhost:${port}`,
    port,
    openPage: "index.html",
    disableHostCheck: true,
    contentBase: path.resolve(__dirname, '../'),
    watchContentBase: true,
    noInfo: true,
    hot: true,
    open: true,
    historyApiFallback: true,
    overlay: true,
    inline: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache"
    },
    before(_app, _server, _compiler) {
      console.log(`Server running at http://localhost:${port}`);
    }
  }
};
