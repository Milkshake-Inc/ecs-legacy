import { Sound } from '../components/Sound';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import { Howl, Howler } from 'howler';
import { Engine } from '@ecs/ecs/Engine';
import Transform from '@ecs/plugins/Transform';
import { useState } from '@ecs/ecs/helpers';

export class SoundState {
	static fromStorage(): SoundState {
		const storedVolume = window.localStorage.getItem('soundState');
		return new SoundState(storedVolume ? Number(storedVolume) : 1);
	}

	static toStorage(soundState: SoundState) {
		window.localStorage.setItem('soundState', soundState.volume.toString());
	}

	public volume = 1;

	public get muted() {
		return this.volume == 0;
	}

	public set muted(value: boolean) {
		this.volume = value ? 0 : 1;
	}

	public toggle() {
		return (this.muted = !this.muted);
	}

	constructor(volume = 1) {
		this.volume = volume;
	}
}

export default class SoundSystem extends IterativeSystem {
	protected engine: Engine;
	protected sounds: Map<Entity, Howl> = new Map();

	protected state = useState(this, SoundState.fromStorage());

	constructor() {
		super(makeQuery(all(Sound)));
	}

	public updateFixed(dt: number) {
		Howler.volume(this.state.volume);

		super.updateFixed(dt);
		Howler.pos(1280 / 2, 720 / 2, 0);
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

		if (sound.play && !sound.playing) {
			console.log(`🔊 playing sound ${sound.src}`);
			howl.play(sound.playSprite);
			sound.playing = true;
		}

		if (!sound.play && sound.playing) {
			console.log(`🔊 stopping sound ${sound.src}`);
			howl.stop();
			sound.playing = false;
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

		if (entity.has(Transform)) {
			const pos = entity.get(Transform);
			howl.pos(pos.x, pos.y, 0);
			howl.pannerAttr({
				panningModel: 'HRTF',
				refDistance: 0.8,
				rolloffFactor: 0.5,
				distanceModel: 'linear',
				maxDistance: 1000
			});
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
