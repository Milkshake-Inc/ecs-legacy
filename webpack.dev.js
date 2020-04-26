const fs = require('fs');
const chalk = require('chalk');
const { project, projectPath } = require('./webpack.base.js');

const hasClient = fs.existsSync(`${projectPath}/Client.ts`);
const hasServer = fs.existsSync(`${projectPath}/Server.ts`);

const webpacks = [];

if(hasClient) {
    webpacks.push(require('./webpack.client.js'))
}

if(hasServer) {
    webpacks.push(require('./webpack.server.js'))
}

if(!hasClient && !hasServer) {
    console.log(chalk.red.bold(`❌  No Client.ts or Server.ts in ${projectPath}`))
    process.exit()
}

console.log(chalk.bold.blue(`\n🌱  Starting project '${project}' - Client: ${hasClient} Server: ${hasServer}`))

module.exports = webpacks;
