const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { baseConfig, projectPath } = require('./webpack.base.js');
const { merge } = require('webpack-merge');
const WebpackBar = require('webpackbar');
const cwd = process.cwd();

const config = {
	name: 'Server',
	entry: `${projectPath}/src/Server.ts`,
	target: 'node',
	node: {
		// Need this when working with express, otherwise the build fails
		__dirname: false, // if you don't put this is, __dirname
		__filename: false // and __filename return blank or /
	},
	plugins: [
		new NodemonPlugin({
			nodeArgs: ['--inspect=0.0.0.0:9229'],
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
		}),
		new CopyPlugin({
			patterns: [
				{ from: `${projectPath}/www`, to: './www' },
				{ from: 'node_modules/ammo.js/builds/', to: '.' },
				{ from: './ecs/src/engine/plugins/physics/physx/build/', to: '.' }
			]
		})
	],
	externals: [
		nodeExternals({
			allowlist: [/^three/]
		})
	],
	output: {
		path: path.resolve(cwd, 'bin/server'),
		filename: 'server.js'
	}
};

module.exports = merge(baseConfig, config);
