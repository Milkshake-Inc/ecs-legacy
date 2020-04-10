const path = require('path');

module.exports = {
	mode: 'development',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: [/node_modules/]
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
