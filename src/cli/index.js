#!/usr/bin/env node

const webpack = require('webpack');
const webpackConfig = require('./config/webpack.dev')

const compiler = webpack(webpackConfig);

compiler.watch({
}, (err, stats) => {
    if (err) {
        console.error(err.stack || err);
        if (err.details) {
            console.error(err.details);
        }
        return;
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
        info.errors.forEach((error) => {
            const err = error.split("\n");

            console.log(`${err[2]}\n${err[3]}\n`)
            console.log(err)
        })
    }

});