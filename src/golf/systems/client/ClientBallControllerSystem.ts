import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useQueries, useSingletonQuery, useState } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { all, makeQuery } from '@ecs/ecs/Query';
import Input from '@ecs/plugins/input/components/Input';
import { Controls, GamepadButton, Gesture, Key, MouseButton } from '@ecs/plugins/input/Control';
import Gamepad from '@ecs/plugins/input/Gamepad';
import Keyboard from '@ecs/plugins/input/Keyboard';
import Mouse from '@ecs/plugins/input/Mouse';
import Touch from '@ecs/plugins/input/Touch';
import MathHelper from '@ecs/plugins/math/MathHelper';
import Transform from '@ecs/plugins/math/Transform';
import Vector3 from '@ecs/plugins/math/Vector';
import Session from '@ecs/plugins/net/components/Session';
import { Sound } from '@ecs/plugins/sound/components/Sound';
import { ToThreeVector3 } from '@ecs/plugins/tools/Conversions';
import { ArrowHelper, PerspectiveCamera } from 'three';
import GolfPlayer from '../../components/GolfPlayer';
import PlayerBall from '../../components/PlayerBall';
import { GolfGameState, GolfPacketOpcode, PotBall, useGolfNetworking } from '../../constants/GolfNetworking';
import Random from '@ecs/plugins/math/Random';
import Raycast, { RaycastDebug } from '@ecs/plugins/render/3d/components/Raycaster';

export class BallControllerState {
	public power: number;
	public direction: number;
}

const PlayerInputs = {
	shoot: Controls.or(
		Keyboard.key(Key.Space),
		Mouse.button(MouseButton.Left),
		Touch.gesture(Gesture.Press),
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
		power: 0,
		direction: 1
	});

	protected gameState = useSingletonQuery(this, GolfGameState);

	protected inputs = useState(this, new Input(PlayerInputs));

	protected networking = useGolfNetworking(this);

	directionLine: Entity;

	constructor() {
		super(makeQuery(all(Transform, PlayerBall, Session)));

		this.networking.on(GolfPacketOpcode.POT_BALL, (packet, entity) => this.handleBallPot(packet, entity));
	}

	public onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);

		this.directionLine = new Entity();
		this.directionLine.add(Transform);
		this.directionLine.add(RaycastDebug, { length: 0 });
		this.directionLine.add(Raycast);
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

		const directionVector = cameraTransform.forward.projectOnPlane(Vector3.UP).normalize();

		if (this.directionLine) {
			this.directionLine.get(Transform).position = characterTransform.position.clone();
			const mappedPower = MathHelper.map(0, 100, 0, 9, this.state.power);
			this.directionLine.get(Raycast).direction = directionVector;
			this.directionLine.get(RaycastDebug).length = mappedPower / 10;
		}

		const moving = entity.get(PlayerBall).moving;

		if (camera && !moving) {
			if (this.inputs.state.shoot.once) {
				this.state.power = 1;

				this.networking.send({
					opcode: GolfPacketOpcode.PREP_SHOOT
				});
			}

			if (this.inputs.state.shoot.down) {
				this.state.power += 0.6 * this.state.direction;
				this.state.power = MathHelper.clamp(this.state.power, 0, 100);

				if (this.state.power == 100 || this.state.power == 0) {
					this.state.direction *= -1;
				}
			}

			if (this.inputs.state.shoot.up) {
				this.state.direction = 1;
				const mappedPower = MathHelper.map(0, 100, 0, 9, this.state.power);

				console.log(`Shot Power: ${mappedPower} - ID: ${entity.get(Session).id}`);

				const powerVector = directionVector.multiF(mappedPower);

				this.networking.send({
					opcode: GolfPacketOpcode.SHOOT_BALL,
					velocity: {
						x: powerVector.x,
						z: powerVector.z
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
		console.log('☀SUNSHINE DAY !☀');
		const player = entity.get(GolfPlayer);

		entity.add(Sound, { src: 'assets/golf/sounds/hole.mp3' });

		if (player?.score[this.gameState().currentHole] <= 1) {
			entity.add(Sound, { src: 'assets/golf/sounds/yay.mp3' });
		}
	}
}
