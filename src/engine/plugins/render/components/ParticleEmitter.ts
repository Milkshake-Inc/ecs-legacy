import { EmitterConfig } from 'pixi-particles';
import DisplayObject from './DisplayObject';

export default class ParticleEmitter extends DisplayObject {
	public constructor(public textures: string[] = [], public config: EmitterConfig, public emit = true) {
		super();
	}
}
