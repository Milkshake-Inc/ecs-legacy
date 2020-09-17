#!/usr/bin/env node

const webpack = require('webpack');
const webpackConfig = require('./config/webpack.dev')

const compiler = webpack(webpackConfig);

compiler.watch({
  aggregateTimeout: 300,
  poll: undefined
}, () => {

});