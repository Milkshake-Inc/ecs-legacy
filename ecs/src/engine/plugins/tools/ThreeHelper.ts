import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Texture, TextureLoader } from 'three';
import { PlatformHelper } from './Platform';

export const LoadGLTF = (content: string): Promise<GLTF> => {
	return new Promise((resolve, reject) => {
		const loader = new GLTFLoader();
		if (PlatformHelper.IsServer) {
			const data = require('fs').readFileSync(`${__dirname}/www/${content}`);

			loader.parse(trimBuffer(data), '', resolve, reject);
			return;
		}
		loader.load(content, resolve, undefined, reject);
	});
};

export const LoadTexture = (content: string): Promise<Texture> => {
	return new Promise((resolve, reject) => {
		if (PlatformHelper.IsServer) return resolve();
		const loader = new TextureLoader();
		loader.load(content, resolve, undefined, reject);
	});
};

function trimBuffer(buffer) {
	const { byteOffset, byteLength } = buffer;

	return buffer.buffer.slice(byteOffset, byteOffset + byteLength);
}
