const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const cwd = process.cwd();

const { baseConfig, projectPath, port, project, emoji } = require('./webpack.base.js');
const { merge } = require('webpack-merge');
const WebpackBar = require('webpackbar');
const chalk = require('chalk');
const capitalize = require('capitalize');

const GitRevisionPlugin = require('git-revision-webpack-plugin');
const gitRevisionPlugin = new GitRevisionPlugin();

const config = {
	name: 'Client',
	entry: [`${projectPath}/src/Client.ts`],
	module: {
		rules: [
			{
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
		path: path.resolve(cwd, 'bin/www'),
		filename: 'client.js?t=' + new Date().getTime()
	},
	plugins: [
		new CopyPlugin({
			patterns: [{ from: `${projectPath}/www`, to: './' }]
		}),
		new HtmlWebpackPlugin({
			title: capitalize(project),
			template: __dirname + '/template.html',
			templateParameters: {
				emoji
			}
		}),
		new WebpackBar({
			name: 'Client',
			profile: true
		}),
		new webpack.DefinePlugin({
			VERSION: JSON.stringify(gitRevisionPlugin.commithash())
		})
	]
};

module.exports = merge(baseConfig, config);
