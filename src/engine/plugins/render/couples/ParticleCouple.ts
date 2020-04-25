import { System } from '@ecs/ecs/System';
import Position from '@ecs/plugins/Position';
import { all } from '@ecs/utils/QueryHelper';
import { Emitter, EmitterConfig, OldEmitterConfig } from 'pixi-particles';
import { Container, Texture } from 'pixi.js';
import ParticleEmitter from '../components/ParticleEmitter';
import { usePixiCouple } from './PixiCouple';

class ParticleEmitterDisplayObject extends Container {
	public emitter: Emitter;

	constructor(particleImages: Texture[], config: EmitterConfig | OldEmitterConfig) {
		super();

		this.emitter = new Emitter(this, particleImages, config);
	}
}

export const useParticleCouple = (system: System) =>
	usePixiCouple<ParticleEmitterDisplayObject>(system, all(Position, ParticleEmitter), {
		onCreate: entity => {
			const { textures, config } = entity.get(ParticleEmitter);

			const pixiTextures = textures.map(textureUrl => Texture.from(textureUrl));

			return new ParticleEmitterDisplayObject(pixiTextures, config);
		},
		onUpdate: (entity, displayObject, deltaTime) => {
			const position = entity.get(Position);
			const emitter = entity.get(ParticleEmitter);

			displayObject.position.set(0, 0); //HACK
			displayObject.emitter.updateSpawnPos(position.x + emitter.offset.x, position.y + emitter.offset.y);
			displayObject.emitter.emit = emitter.emit;

			displayObject.emitter.update(deltaTime * 0.001);
		}
	});
