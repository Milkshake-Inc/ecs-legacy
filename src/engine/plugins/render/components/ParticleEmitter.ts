import { EmitterConfig } from 'pixi-particles';
import Vector3 from '@ecs/math/Vector';

export default class ParticleEmitter {
	public constructor(
		public textures: string[] = [],
		public config: EmitterConfig,
		public emit = true,
		public offset: Vector3 = Vector3.ZERO
	) {}
}
