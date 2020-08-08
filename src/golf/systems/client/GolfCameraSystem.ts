import { Engine } from '@ecs/ecs/Engine';
import { useQueries, useSingletonQuery, useState } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import ThirdPersonCameraSystem from '@ecs/plugins/render/3d/systems/ThirdPersonCameraSystem';
import Session from '@ecs/plugins/net/components/Session';
import { all } from '@ecs/ecs/Query';
import PlayerBall from '../../components/PlayerBall';
import { GameState, GolfGameState } from '../../constants/GolfNetworking';
import ThirdPersonTarget from '@ecs/plugins/render/3d/systems/ThirdPersonTarget';
import { DirectionalLight } from 'three';
import Mouse from '@ecs/plugins/input/Mouse';
import Input from '@ecs/plugins/input/components/Input';
import { MouseButton } from '@ecs/plugins/input/Control';
import Transform from '@ecs/plugins/math/Transform';
import Random from '@ecs/plugins/math/Random';

export class GolfCameraState {
	constructor(public target = Random.int(0, 30)) {}
}

export default class GolfCameraSystem extends System {
	protected engine: Engine;

	protected getGameState = useSingletonQuery(this, GolfGameState);

	protected inputs = useState(
		this,
		new Input({
			click: Mouse.button(MouseButton.Left)
		})
	);

	protected state = useState(this, new GolfCameraState());

	private query = useQueries(this, {
		players: all(Transform, PlayerBall),
		localPlayer: all(Transform, PlayerBall, Session),
		currentTarget: all(ThirdPersonTarget),
		lights: all(DirectionalLight)
	});

	constructor(engine: Engine) {
		super();

		this.engine = engine;
	}

	get localPlayer() {
		return this.query.localPlayer.first;
	}

	updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		const gameState = this.getGameState();

		if (gameState.state == GameState.INGAME) {
			// See of we need to change from current target
			const currentTarget = this.query.currentTarget.first;
			let newTarget = currentTarget;

			if (this.localPlayer) {
				newTarget = this.localPlayer;

				// Probably move this somewhere else?
				if (this.inputs.state.click.once) {
					Mouse.startPointerLock();
				}
			} else if (this.query.players.length > 0) {
				const targetIndex = Math.abs(this.state.target % this.query.players.length);
				newTarget = this.query.players.entities[targetIndex];

				// Probably move this somewhere else?
				Mouse.stopPointerLock();
			} else {
				console.log('No one to spectate.');
			}

			if (currentTarget != newTarget) {
				console.log(`Switching to ${newTarget}`);
				if (currentTarget) {
					currentTarget.remove(ThirdPersonTarget);
				}

				newTarget.add(ThirdPersonTarget);
			}
		}

		if (gameState.state == GameState.INGAME && !this.engine.hasSystem(ThirdPersonCameraSystem)) {
			console.log('Create camera!');
			this.engine.addSystem(new ThirdPersonCameraSystem());
			Mouse.startPointerLock();
		}

		if (gameState.state == GameState.LOBBY && this.engine.hasSystem(ThirdPersonCameraSystem)) {
			console.log('Remove camera!');
			this.engine.removeSystem(this.engine.getSystem(ThirdPersonCameraSystem));
			Mouse.stopPointerLock();
		}

		const lightEntity = this.query.lights.first;
		const target = this.query.currentTarget.first;

		if (lightEntity && target && target.has(Transform)) {
			const directionalLight = lightEntity.get(DirectionalLight);
			const directionalLightTrasnform = lightEntity.get(Transform);
			const targetPosition = target.get(Transform).position;

			directionalLightTrasnform.position.set(targetPosition.x + 5, 5, targetPosition.z + 5);
			directionalLight.target.position.set(targetPosition.x, 0, targetPosition.z);
		}
	}
}
