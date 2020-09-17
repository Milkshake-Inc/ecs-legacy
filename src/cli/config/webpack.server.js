const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const { baseConfig, projectPath } = require('./webpack.base.js');
const merge = require('webpack-merge');
const WebpackBar = require('webpackbar');

const config = {
	entry: `${projectPath}/src/Server.ts`,
	target: 'node',
	node: {
		// Need this when working with express, otherwise the build fails
		__dirname: false, // if you don't put this is, __dirname
		__filename: false // and __filename return blank or /
	},
	plugins: [
		new NodemonPlugin({
			nodeArgs: ['--inspect'],
			watch: path.resolve('./bin'),
			ignore: ['client.js', 'client.js.map'],
			ext: 'js,glb',
			delay: '500',
			quiet: true,
			verbose: false
		}),
		new WebpackBar({
			name: 'Server',
			color: 'orange'
		})
	],
	externals: [
		nodeExternals({
			whitelist: [/^three/]
		})
	],
	output: {
		filename: 'server.js',
		path: path.resolve(__dirname, 'bin')
	}
};

module.exports = merge(baseConfig, config);
