#!/usr/bin/env node

const webpack = require('webpack');
const webpackConfig = require('./config/webpack.dev');
const chalk = require('chalk');
const { port } = require('./config/webpack.base.js');
const compiler = webpack(webpackConfig);

const publicIp = require('public-ip');
const localIp = require('./localIp')();

compiler.watch({}, (error, stats) => {
    if (error) {
        console.error(error);
        return;
    }

    console.log(stats.toString('errors-warnings'));
});

publicIp.v4().then(publicIp => {
    console.log(chalk.bold('✨  Client available at:'));
    console.log(chalk.bold('🏠  Local:  ') + chalk.green(`http://${localIp}:${port}`))
    console.log(chalk.bold('🌍  Public: ') + chalk.green(`http://${publicIp}:${port}`))
});