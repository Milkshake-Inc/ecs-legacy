#!/usr/bin/env node

const webpack = require('webpack');
const webpackConfig = require('./config/webpack.dev');
const chalk = require('chalk');
const { port } = require('./config/webpack.base.js');
const compiler = webpack(webpackConfig);

const publicIp = require('public-ip');

compiler.watch({}, (error, stats) => {
    if (error) {
        console.error(error);
        return;
    }

    console.log(stats.toString('errors-warnings'));
});

publicIp.v4().then(ip => {
    console.log(chalk.bold('✨  Client hosted at ') + chalk.green(`http://${ip}:${port}`));
});