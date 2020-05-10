const path = require('path');

const yargs = require('yargs');

const argv = yargs
	.command('project', 'Project name', {
		year: {
			description: 'which project to run',
			alias: 'p',
			type: 'string'
		}
	})
	.help()
	.alias('help', 'h').argv;

exports.project = argv.project || 'ship';

exports.projectPath = `./src/${exports.project}`;

exports.baseConfig = {
	mode: 'development',
	module: {
		rules: [
			{
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
		alias: resolveTsconfigPathsToAlias()
	},
	output: {
		path: path.resolve(__dirname, 'bin')
	},
	stats: 'errors-only',
	devtool: 'source-map'
};

function resolveTsconfigPathsToAlias({ tsconfigPath = './tsconfig.json', webpackConfigBasePath = __dirname } = {}) {
	const { paths } = require(tsconfigPath).compilerOptions;

	const aliases = {};

	Object.keys(paths).forEach(item => {
		const key = item.replace('/*', '');
		const value = path.resolve(webpackConfigBasePath, paths[item][0].replace('/*', '').replace('*', ''));

		aliases[key] = value;
	});

	return aliases;
}
