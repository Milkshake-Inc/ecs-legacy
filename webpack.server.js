const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const { baseConfig, projectPath } = require('./webpack.base.js');
const merge = require('webpack-merge');
const WebpackBar = require('webpackbar');

const config = {
	entry: `${projectPath}/Server.ts`,
	target: 'node',
	node: {
		// Need this when working with express, otherwise the build fails
		__dirname: false, // if you don't put this is, __dirname
		__filename: false // and __filename return blank or /
	},
	plugins: [
		new NodemonPlugin({
			quiet: true,
			nodeArgs: ['--inspect']
		}),
		new WebpackBar({
			name: 'Server',
			color: 'orange'
		})
	],
	externals: [
		nodeExternals({
			whitelist: [/^three\/examples\/jsm/]
		})
	],
	output: {
		filename: 'server.js',
		path: path.resolve(__dirname, 'bin')
	}
};

module.exports = merge(baseConfig, config);
