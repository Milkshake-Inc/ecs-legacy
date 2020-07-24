const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { baseConfig, projectPath } = require('./webpack.base.js');
const merge = require('webpack-merge');
const WebpackBar = require('webpackbar');
const chalk = require('chalk');

const config = {
    entry: [`${projectPath}/Client.ts`],
    module: {
        rules: [{
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                exclude: /node_modules/,
                use: ['raw-loader', 'glslify-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    node: {
        fs: 'empty'
    },
    output: {
        path: path.resolve(__dirname, 'bin/www'),
        filename: 'client.js'
    },
    plugins: [
        new CopyPlugin([{ from: './www', to: './', context: './' }]),
        new HtmlWebpackPlugin({
            title: 'ECS'
        }),
        new WebpackBar({
            name: 'Client',
            reporter: {
                allDone(context) {
                    console.log(chalk.bold('✨  Server running at ') + chalk.green('http://localhost:9090'));
                }
            }
        })
    ]
};

module.exports = merge(baseConfig, config);