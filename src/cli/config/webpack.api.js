const path = require('path');
const nodeExternals = require('webpack-node-externals');
const RunNodeWebpackPlugin = require('run-node-webpack-plugin');
const { baseConfig, projectPath } = require('./webpack.base.js');
const { merge } = require('webpack-merge');
const WebpackBar = require('webpackbar');
const cwd = process.cwd();

const config = {
    name: 'Api',
    entry: [`${projectPath}/src/Api.ts`],
    target: 'node',
    node: {
        // Need this when working with express, otherwise the build fails
        __dirname: false, // if you don't put this is, __dirname
        __filename: false // and __filename return blank or /
    },
    plugins: [
        new RunNodeWebpackPlugin({
            scriptToRun: "api.js",
            scriptsToWatch: ['api.js'],
            nodeArgs: ['--inspect=0.0.0.0:9228'],
            runOnlyInWatchMode: true,
        }),
        new WebpackBar({
            name: 'Api',
            color: 'yellow'
        }),
    ],
    externals: [
        nodeExternals({
            allowlist: [/^three/]
        })
    ],
    output: {
        path: path.resolve(cwd, 'bin/api'),
        filename: 'api.js'
    }
};

module.exports = merge(baseConfig, config);