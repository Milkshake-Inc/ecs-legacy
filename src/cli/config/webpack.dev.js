const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const { project, projectPath, host, port, emoji } = require('./webpack.base.js');
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve');
const localIp = require('../localIp')();
const cwd = process.cwd();

const hasClient = fs.existsSync(`${projectPath}src/Client.ts`);
const hasServer = fs.existsSync(`${projectPath}/src/Server.ts`);
const hasApi = fs.existsSync(`${projectPath}/src/Api.ts`);

const webpacks = [];

if (hasClient) {
    const devServer = new Serve({
        port,
        host: localIp,
        open: true,
        static: path.join(cwd, 'bin/www'),
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
    const server = require('./webpack.server.js');
    webpacks.push(server);
}

if (hasApi) {
    const api = require('./webpack.api.js');
    webpacks.push(api);
}

if (!hasClient && !hasServer) {
    console.log(chalk.red.bold(`❌  No Client.ts or Server.ts in ${projectPath}`));
    process.exit();
}

console.log(chalk.bold.blue(`\n ${emoji}  Starting project '${project}'\n  Client: ${hasClient}\n  Server: ${hasServer}\n  Api: ${hasApi}`));

module.exports = webpacks;