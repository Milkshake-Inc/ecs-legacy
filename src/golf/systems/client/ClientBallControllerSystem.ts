import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useQueries, useState } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Key from '@ecs/input/Key';
import Keyboard from '@ecs/input/Keyboard';
import MathHelper from '@ecs/math/MathHelper';
import Random from '@ecs/math/Random';
import Vector3 from '@ecs/math/Vector';
import Session from '@ecs/plugins/net/components/Session';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { ToThreeVector3 } from '@ecs/plugins/physics/utils/Conversions';
import { Sound } from '@ecs/plugins/sound/components/Sound';
import Transform from '@ecs/plugins/Transform';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { ArrowHelper, PerspectiveCamera } from 'three';
import PlayerBall from '../../components/PlayerBall';
import { GolfPacketOpcode, PotBall, useGolfNetworking } from '../../constants/GolfNetworking';

export class BallControllerState {
	public power: number;
}

export default class ClientBallControllerSystem extends IterativeSystem {
	private shootKey = Key.SPACEBAR;

	protected keyboard: Keyboard;

	protected queries = useQueries(this, {
		camera: all(PerspectiveCamera)
	});

	protected state = useState(this, new BallControllerState(), {
		power: 0
	});

	protected networking = useGolfNetworking(this);

	directionLine: Entity;

	constructor() {
		super(makeQuery(all(Transform, PlayerBall, CannonBody, Session)));

		this.keyboard = new Keyboard();

		this.networking.on(GolfPacketOpcode.POT_BALL, (packet, entity) => this.handleBallPot(packet, entity));
	}

	public onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);

		this.directionLine = new Entity();
		this.directionLine.add(Transform);
		this.directionLine.add(new ArrowHelper(ToThreeVector3(Vector3.FORWARD), ToThreeVector3(Vector3.ZERO), 10, 0xff0050));
		engine.addEntity(this.directionLine);
	}

	public onRemovedFromEngine(engine: Engine) {
		super.onRemovedFromEngine(engine);

		engine.removeEntity(this.directionLine);
	}

	updateEntityFixed(entity: Entity, deltaTime: number) {
		const camera = this.queries.camera.first;

		const cameraTransform = camera.get(Transform);
		const characterTransform = entity.get(Transform);

		const directionVector = cameraTransform.position.sub(characterTransform.position).normalize();

		this.directionLine.get(Transform).position = characterTransform.position.clone();
		this.directionLine.get(Transform).rz = Math.PI / 2;
		this.directionLine.get(Transform).ry = -Math.atan2(directionVector.z, directionVector.x);

		if (camera) {
			if (this.keyboard.isPressed(this.shootKey)) {
				this.state.power = 1;

				this.networking.send({
					opcode: GolfPacketOpcode.PREP_SHOOT
				});
			}

			if (this.keyboard.isDown(this.shootKey)) {
				this.state.power += 1.2;
				this.state.power = MathHelper.clamp(this.state.power, 0, 100);

				this.directionLine.get(ArrowHelper).setLength(this.state.power / 10);
			}

			if (this.keyboard.isReleased(this.shootKey)) {
				const mappedPower = MathHelper.map(0, 100, 1, 10, this.state.power);

				console.log(`Shot Power: ${mappedPower} - ID: ${entity.get(Session).id}`);

				const powerVector = directionVector.multiF(mappedPower);

				this.networking.send({
					opcode: GolfPacketOpcode.SHOOT_BALL,
					velocity: {
						x: -powerVector.x,
						z: -powerVector.z
					}
				});

				entity.add(Sound, {
					src: `assets/golf/sounds/hit${Random.fromArray(['1', '2', '3', '4'])}.mp3`
				});
			}
		}

		this.keyboard.update();
	}

	handleBallPot(packet: PotBall, entity: Entity) {
		console.log('☀SUNSHINE DAY!☀');
		// entity.add(Sound, { src: 'assets/golf/sounds/yay.mp3' });
	}
}
