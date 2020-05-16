import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export default class GLTFHolder {
	constructor(value: GLTF) {
		this.value = value;
	}
	value: GLTF;
}
