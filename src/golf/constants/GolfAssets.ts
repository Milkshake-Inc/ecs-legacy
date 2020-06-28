import { KenneyAssets } from './Assets';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

type AssetsMap<T, K> = {
	[P in keyof T]: K;
};

export type KenneyAssetsGLTF = Partial<AssetsMap<typeof KenneyAssets, GLTF>>;

export default class GolfAssets {
	gltfs: KenneyAssetsGLTF = {};
}
