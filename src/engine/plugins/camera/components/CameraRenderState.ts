import { Sprite } from 'pixi.js';
import Camera from './Camera';

export default class CameraRenderState {
	public constructor(public renderSprites: Map<Camera, Sprite> = new Map()) {}
}
