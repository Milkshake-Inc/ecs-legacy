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
	protected keyboard: Keyboard;

	protected queries = useQueries(this, {
		camera: all(PerspectiveCamera)
	});

	protected state = useState(this, new BallControllerState(), {
		power: 0
	})

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
			if (this.keyboard.isPressed(Key.X)) {
				this.state.power = 1;

				this.networking.send({
					opcode: GolfPacketOpcode.PREP_SHOOT
				});
			}

			if (this.keyboard.isDown(Key.X)) {
				this.state.power += 1.2;
				this.state.power = MathHelper.clamp(this.state.power, 0, 100);

				this.directionLine.get(ArrowHelper).setLength(this.state.power / 10);
			}

			if (this.keyboard.isReleased(Key.X)) {
				const mappedPower = MathHelper.map(0, 100, 1, 10, this.state.power);

				console.log(`Shot Power: ${mappedPower} - ID: ${entity.get(Session).id}`);

				const powerVector = directionVector.multiF(mappedPower);
				console.log(entity.get(Session).id);
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
		entity.add(Sound, { src: 'assets/golf/sounds/yay.mp3' });
	}

	// drawPowerBar() {
	// 	this.graphics.clear();
	// 	this.graphics.beginFill(Color.White);
	// 	this.graphics.drawRect(0, 0, 400, 50);

	// 	this.graphics.beginFill(Color.Gray);
	// 	this.graphics.drawRect(5, 5, 400 - 10, 50 - 10);

	// 	this.graphics.beginFill(0xff0050);
	// 	const width = ((400 - 10) / 100) * this.power;
	// 	this.graphics.drawRect(5, 5, width, 50 - 10);

	// 	const quater = ((400 - 10) / 100) * 25;
	// 	this.graphics.beginFill(Color.White);
	// 	this.graphics.drawRect(5 + quater, 5, 2, 50 - 10);

	// 	const half = ((400 - 10) / 100) * 50;
	// 	this.graphics.beginFill(Color.White);
	// 	this.graphics.drawRect(5 + half, 5, 2, 50 - 10);

	// 	const threequater = ((400 - 10) / 100) * 75;
	// 	this.graphics.beginFill(Color.White);
	// 	this.graphics.drawRect(5 + threequater, 5, 2, 50 - 10);
	// }


}
