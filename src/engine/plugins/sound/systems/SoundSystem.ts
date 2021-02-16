import { Sound } from '../components/Sound';
import { all, Entity, System } from 'tick-knock';
import { Howl, Howler } from 'howler';
import Transform from '@ecs/plugins/math/Transform';
import { useState, useQueries } from '@ecs/core/helpers';
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

export default class SoundSystem extends System {
	protected debug = false;

	protected sounds: Map<Entity, Howl[]> = new Map();
	protected state = useState(this, SoundState.fromStorage());
	protected queries = useQueries(this, {
		listener: all(Transform, SoundListener),
		sounds: all(Sound)
	});

	public updateFixed(dt: number) {
		super.updateFixed(dt);

		Howler.volume(this.state.volume);

		if (this.listener) {
			const listenerPos = this.listener.get(Transform);
			if (isNaN(listenerPos.x)) return;
			Howler.pos(listenerPos.x, listenerPos.y, listenerPos.z);
		}

		this.queries.sounds.forEach(entity => this.updateSound(entity));
		this.queries.sounds.onEntityRemoved.connect(snapshot => {
			const sounds = this.sounds.get(snapshot.entity);
			if (sounds) {
				sounds.forEach(s => s.stop());
				this.sounds.delete(snapshot.entity);
			}
		});
	}

	protected updateSound(entity: Entity): void {
		const sound = entity.get(Sound);
		let howls = this.sounds.get(entity);

		if (!howls) {
			if (this.debug) console.log('🔊 adding sound');
			const srcs = Array.isArray(sound.src) ? sound.src : [sound.src];

			howls = srcs.map(
				src =>
					new Howl({
						html5: false,
						onend: (id: number) => {
							this.onSoundEnd(entity);
						},
						...sound,
						src: src,
						loop: false
					})
			);

			this.sounds.set(entity, howls);
		}

		const howl = howls[sound.playingSrcIndex];

		if (sound.play && !sound.playing) {
			if (this.debug) console.log(`🔊 playing sound ${sound.src}`);

			howl.play(sound.playSprite);
			sound.playing = true;
		}

		if (!sound.play && sound.playing) {
			if (this.debug) console.log(`🔊 stopping sound ${sound.src}`);
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
		const sound = entity.get(Sound);
		const howls = this.sounds.get(entity);
		sound.playing = false;
		sound.playingSrcIndex++;

		if (sound.playingSrcIndex > howls.length - 1) {
			if (sound.loop) {
				sound.playingSrcIndex = 0;
			} else {
				this.removeSound(entity);
			}
		}
	}

	protected removeSound(entity: Entity) {
		if (this.debug) console.log(`🔊 removing sound ${entity.get(Sound).src}`);

		const { autoRemoveEntity } = entity.get(Sound);

		entity.remove(Sound);
		this.sounds.delete(entity);

		if (autoRemoveEntity) {
			this.engine.removeEntity(entity);
			if (this.debug) console.log('Removing Sound Entity');
		}
	}
}
