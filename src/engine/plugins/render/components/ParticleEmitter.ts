import { EmitterConfig } from 'pixi-particles';
import DisplayObject from './DisplayObject';
import Vector2 from '@ecs/math/Vector2';

export default class ParticleEmitter extends DisplayObject {
	public constructor(
		public textures: string[] = [],
		public config: EmitterConfig,
		public emit = true,
		public offset: Vector2 = Vector2.ZERO
	) {
		super();
	}
}
