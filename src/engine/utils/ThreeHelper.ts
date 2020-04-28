import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export const LoadGLTF = (content: string): Promise<GLTF> => {
	return new Promise(resolve => {
		const loader = new GLTFLoader();
		loader.load(content, resolve);
	});
};
