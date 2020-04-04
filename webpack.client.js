const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const baseConfig = require('./webpack.base.js');
const merge = require('webpack-merge');
const WebpackBar = require('webpackbar');
const chalk = require('chalk');

const { WebpackPluginServe: Serve } = require('webpack-plugin-serve');

const config = {
	entry: ['./src/playground/client/index.ts', 'webpack-plugin-serve/client'],
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js']
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
		}),
		new Serve({
			port: 9090,
			host: '127.0.0.1',
			open: true,
			static: path.join(__dirname, 'bin/www'),
			hmr: false,
			liveReload: true,
			log: { level: 'error' }
		})
	]
};

module.exports = merge(baseConfig, config);
