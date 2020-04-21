import { Sound } from '../components/Sound';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import { Howl, Howler } from 'howler';
import { Engine } from '@ecs/ecs/Engine';

export default class SoundSystem extends IterativeSystem {
	protected engine: Engine;
	protected sounds: Map<Entity, Howl> = new Map();

	constructor() {
		super(makeQuery(all(Sound)));
		Howler.volume(1);
	}

	protected updateEntityFixed(entity: Entity): void {
		const sound = entity.get(Sound);
		let howl = this.sounds.get(entity);

		if (!howl) {
			console.log('🔊 adding sound');
			howl = new Howl({
				html5: false,
				onend: (id: number) => {
					this.onSoundEnd(entity);
				},
				...sound
			});

			this.sounds.set(entity, howl);
		}

		if (sound.play && !howl.playing()) {
			console.log(`🔊 playing sound ${sound.src}`);
			howl.play();
		}

		if (!sound.play && howl.playing()) {
			console.log(`🔊 stopping sound ${sound.src}`);
			howl.stop();
		}

		if (howl['_muted'] != sound.mute) {
			howl.mute(sound.mute);
		}
		if (howl.volume() != sound.volume) {
			howl.volume(sound.volume);
		}
		if (howl.rate() != sound.rate) {
			howl.rate(sound.rate);
		}
		if (howl.loop() != sound.loop) {
			howl.loop(sound.loop);
		}
		if (sound.seek) {
			howl.seek(sound.seek);
			sound.seek = null;
		}
	}

	protected onSoundEnd(entity: Entity) {
		// If looping, don't clean up yet
		if (entity.get(Sound)?.loop) return;

		entity.remove(Sound);
		this.sounds.delete(entity);

		// Probably should do this somewhere else...
		if (entity.components.size == 0) {
			this.engine.removeEntity(entity);
		}
	}

	public onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);
		this.engine = engine;
	}
}
