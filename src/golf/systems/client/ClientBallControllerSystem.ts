import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useQueries, useState } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Keyboard from '@ecs/plugins/input/Keyboard';
import MathHelper from '@ecs/plugins/math/MathHelper';
import Random from '@ecs/plugins/math/Random';
import Vector3 from '@ecs/plugins/math/Vector';
import Session from '@ecs/plugins/net/components/Session';
import CannonBody from '@ecs/plugins/physics/3d/components/CannonBody';
import { ToThreeVector3 } from '@ecs/plugins/tools/Conversions';
import { Sound } from '@ecs/plugins/sound/components/Sound';
import Transform from '@ecs/plugins/math/Transform';
import { all, makeQuery } from '@ecs/ecs/Query';
import { ArrowHelper, PerspectiveCamera } from 'three';
import PlayerBall from '../../components/PlayerBall';
import { GolfPacketOpcode, PotBall, useGolfNetworking } from '../../constants/GolfNetworking';
import { Key, Controls, MouseButton, GamepadButton } from '@ecs/plugins/input/Control';
import Input from '@ecs/plugins/input/components/Input';
import Mouse from '@ecs/plugins/input/Mouse';
import Gamepad from '@ecs/plugins/input/Gamepad';

export class BallControllerState {
	public power: number;
}

const PlayerInputs = {
	shoot: Controls.or(
		Keyboard.key(Key.Space),
		Mouse.button(MouseButton.Left),
		Gamepad.button(GamepadButton.LT, 0),
		Gamepad.button(GamepadButton.LT, 0),
		Gamepad.button(GamepadButton.RT, 0),
		Gamepad.button(GamepadButton.RT, 1)
	)
};

export default class ClientBallControllerSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		camera: all(PerspectiveCamera)
	});

	protected state = useState(this, new BallControllerState(), {
		power: 0
	});

	protected inputs = useState(this, new Input(PlayerInputs));

	protected networking = useGolfNetworking(this);

	directionLine: Entity;

	constructor() {
		super(makeQuery(all(Transform, PlayerBall, CannonBody, Session)));

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
			if (this.inputs.state.shoot.once) {
				this.state.power = 1;

				this.networking.send({
					opcode: GolfPacketOpcode.PREP_SHOOT
				});
			}

			if (this.inputs.state.shoot.down) {
				this.state.power += 1.2;
				this.state.power = MathHelper.clamp(this.state.power, 0, 100);

				this.directionLine.get(ArrowHelper).setLength(this.state.power / 10);
			}

			if (this.inputs.state.shoot.up) {
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

				this.state.power = 0;
			}
		}
	}

	handleBallPot(packet: PotBall, entity: Entity) {
		console.log('☀SUNSHINE DAY!☀');
		// entity.add(Sound, { src: 'assets/golf/sounds/yay.mp3' });
	}
}
