import { Sound } from '../components/Sound';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import { Howl, Howler } from 'howler';
import { Engine } from '@ecs/ecs/Engine';
import Transform from '@ecs/plugins/Transform';
import { useState, useQueries } from '@ecs/ecs/helpers';
import SoundListener from '../components/SoundListener';
import SoundFollowTarget from '../components/SoundFollowTarget';
import { BoxGeometry, Mesh, MeshBasicMaterial, Group } from 'three';

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
	protected queries = useQueries(this, {
		listener: all(Transform, SoundListener)
	});

	constructor() {
		super(makeQuery(all(Sound)));
	}

	public updateFixed(dt: number) {
		Howler.volume(this.state.volume);

		super.updateFixed(dt);

		if (this.listener) {
			const listenerPos = this.listener.get(Transform);
			if (isNaN(listenerPos.x)) return;
			Howler.pos(listenerPos.x, listenerPos.y, listenerPos.z);
		}
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

		if (entity.has(Transform) && entity.has(SoundFollowTarget)) {
			const pos = entity.get(Transform);
			const target = entity.get(SoundFollowTarget);

			const offset = target.offset.applyQuaternion(pos.quaternion);
			const speakerPos = pos.position.add(offset);

			if (target.debug) {
				let mesh = target.debugMesh;
				if (!mesh) {
					mesh = new Mesh(new BoxGeometry(0.5, 0.5, 0.5), new MeshBasicMaterial({ color: 0x00ff00 }));

					const targetMesh = entity.get(Group) || entity.get(Mesh);
					targetMesh.parent.add(mesh);
					target.debugMesh = mesh;
				}

				mesh.position.set(speakerPos.x, speakerPos.y, speakerPos.z);
			}

			howl.pos(speakerPos.x, speakerPos.y, speakerPos.z);
			howl.pannerAttr(target.options);
		}
	}

	protected get listener() {
		return this.queries.listener.first;
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
