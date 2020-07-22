import { Loader } from 'pixi.js';

export const LoadPixiAssets = (content: { [index: string]: string }) => {
	return new Promise(resolve => {
		Object.values(content).forEach(asset => Loader.shared.add(asset));
		Loader.shared.load(resolve);
	});
};
