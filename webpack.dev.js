const fs = require('fs');
const chalk = require('chalk');
const emoji = require('node-emoji');
const path = require('path');
const { project, projectPath, host } = require('./webpack.base.js');
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve');

const hasClient = fs.existsSync(`${projectPath}/src/Client.ts`);
const hasServer = fs.existsSync(`${projectPath}/src/Server.ts`);

const webpacks = [];

if (hasClient) {
	const devServer = new Serve({
		port: 9090,
		host: host,
		open: true,
		static: path.join(__dirname, 'bin/www'),
		hmr: false,
		liveReload: true,
		log: { level: 'error' }
	});

	const client = require('./webpack.client.js');
	client.plugins.push(devServer);
	client.entry.push('webpack-plugin-serve/client');
	webpacks.push(client);
}

if (hasServer) {
	webpacks.push(require('./webpack.server.js'));
}

if (!hasClient && !hasServer) {
	console.log(chalk.red.bold(`❌  No Client.ts or Server.ts in ${projectPath}`));
	process.exit();
}

let projectEmoji = '🌱';

const results = emoji.search(project);
if (results.length > 0) {
	projectEmoji = results[0].emoji;
}

console.log(chalk.bold.blue(`\n ${projectEmoji}  Starting project '${project}' - Client: ${hasClient} Server: ${hasServer}`));

module.exports = webpacks;
