const path = require('path');

const yargs = require('yargs');
const { readdirSync } = require('fs');
const cwd = process.cwd();
const emoji = require('node-emoji');

const games = readdirSync(path.resolve(cwd, './game')).filter((folder) => !folder.includes("."));

const argv = yargs
    .command('project', 'Project name', {
        year: {
            description: 'which project to run',
            alias: 'p',
            type: 'string'
        }
    })
    .command('host', 'Host', {
        year: {
            description: 'host to run dev server on',
            alias: 'h',
            type: 'string'
        }
    })
    .command('port', 'Port', {
        year: {
            description: 'port for run dev server on',
            alias: 'p',
            type: 'number'
        }
    })
    .help()
    .alias('help', 'h').argv;

const project = argv.project || games[0];


let projectEmoji = '🌱';

const results = emoji.search(project);
if (results.length > 0) {
    projectEmoji = results[0].emoji;
}

module.exports = {
    project,
    projectPath: `${process.cwd()}/game/${project}/`,
    host: argv.host || '0.0.0.0',
    port: argv.port || 3000,
    emoji: projectEmoji,
    baseConfig: {
        mode: 'development',
        module: {
            rules: [{
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: [/node_modules/]
                },
                {
                    test: /\.js?$/,
                    use: 'babel-loader',
                    include: [path.resolve(__dirname, 'node_modules/three/examples/jsm')]
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: Object.assign({
                    react: 'preact/compat',
                    'react-dom': 'preact/compat',
                    // Not necessary unless you consume a module using `createClass`
                    'create-react-class': 'preact/compat/lib/create-react-class',
                    // Not necessary unless you consume a module requiring `react-dom-factories`
                    'react-dom-factories': 'preact/compat/lib/react-dom-factories'
                },
                resolveTsconfigPathsToAlias()
            )
        },
        output: {
            path: path.resolve(cwd, 'bin')
        },
        stats: 'errors-only',
        devtool: 'source-map'
    }
};

function resolveTsconfigPathsToAlias({ tsconfigPath = './tsconfig.json', webpackConfigBasePath = cwd } = {}) {
    const { paths } = require(path.resolve(cwd, tsconfigPath)).compilerOptions;

    const aliases = {};

    Object.keys(paths).forEach(item => {
        const key = item.replace('/*', '');
        const value = path.resolve(webpackConfigBasePath, paths[item][0].replace('/*', '').replace('*', ''));

        aliases[key] = value;
    });

    return aliases;
}
