import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Texture, TextureLoader } from 'three';
import { PlatformHelper } from './Platform';

export const LoadGLTF = (content: string): Promise<GLTF> => {
	return new Promise((resolve, reject) => {
		if (PlatformHelper.IsServer()) return resolve();
		const loader = new GLTFLoader();
		loader.load(content, resolve);
	});
};

export const LoadTexture = (content: string): Promise<Texture> => {
	return new Promise((resolve, reject) => {
		if (PlatformHelper.IsServer()) return resolve();
		const loader = new TextureLoader();
		loader.load(content, resolve, undefined, reject);
	});
};
