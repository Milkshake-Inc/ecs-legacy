const fs = require('fs');
const chalk = require('chalk');
const emoji = require('node-emoji')
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

let projectEmoji = "🌱";

const results = emoji.search(project);
if(results.length > 0) {
    projectEmoji = results[0].emoji;

}

console.log(chalk.bold.blue(`\n ${projectEmoji}  Starting project '${project}' - Client: ${hasClient} Server: ${hasServer}`))

module.exports = webpacks;
