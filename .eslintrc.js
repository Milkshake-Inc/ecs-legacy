module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'spellcheck'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended'],
	rules: {
		'spellcheck/spell-checker': [
			1,
			{
				comments: false,
				strings: true,
				identifiers: true,
				lang: 'en_US',
				skipWords: [
					'Readonly',
					'lerp',
					'deadzone',
					'Cornsilk',
					'Gainsboro',
					'hermite',
					'Unclamped',
					'Pixi',
					'pixi',
					'bool',
					'png',
					'preload',
					'antialias',
					'args',
					'moveable',
					'Moveable',
					'keyup',
					'keydown',
					'collidable',
					'pos',
					'Opcode',
					'rtt',
					'hud',
					'Arial',
					'Rect',
					'sortable',
					'Chamferable',
					'Collinear',
					'Centre',
					'Stateful',
					'Decomp',
					'func',
					'renderer'
				],
				skipIfMatch: [
					'http://[^s]*',
					'^[-\\w]+/[-\\w\\.]+$', //For MIME Types
					'radian',
					'Radian',
					'vect',
					'dev'
				],
				skipWordIfMatch: [
					'^foobar.*$' // words that begin with foobar will not be checked
				],
				minLength: 3
			}
		],
		'@typescript-eslint/explicit-function-return-type': 0,
		'@typescript-eslint/no-explicit-any': 0,
		'@typescript-eslint/no-non-null-assertion': 0,
		'@typescript-eslint/no-use-before-define': 0,
		'@typescript-eslint/no-empty-function': 0,
		'@typescript-eslint/consistent-type-assertions': 0,
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				vars: 'all',
				args: 'none',
				ignoreRestSiblings: false
			}
		]
	}
};
