import { Engine } from '@ecs/ecs/Engine';
import { useQueries, useSingletonQuery } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Keyboard from '@ecs/input/Keyboard';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import Session from '@ecs/plugins/net/components/Session';
import { all } from '@ecs/utils/QueryHelper';
import { Transform } from 'cannon-es';
import PlayerBall from '../../components/PlayerBall';
import { GameState, GolfGameState } from '../../constants/GolfNetworking';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import Random from '@ecs/math/Random';
import { DirectionalLight } from 'three';

export default class GolfCameraSystem extends System {
	protected engine: Engine;

	protected getGameState = useSingletonQuery(this, GolfGameState);

	private keyboard: Keyboard = new Keyboard();

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

	updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		this.keyboard.update();

		const gameState = this.getGameState();

		if (gameState.state == GameState.INGAME) {
			const currentTarget = this.query.currentTarget.first;
			let newTarget = currentTarget;

			if (currentTarget == undefined && this.query.localPlayer.length == 0) {
				// Spectate random player
				if (this.query.players.length > 0) {
					const randomPlayer = Random.fromArray(Array.from(this.query.players.entities));
					newTarget = randomPlayer;
				} else {
					console.log('No one to spectate.');
				}
			}

			if (currentTarget == undefined && this.query.localPlayer.length > 0) {
				newTarget = this.query.localPlayer.first;
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
		}

		if (gameState.state == GameState.LOBBY && this.engine.hasSystem(ThirdPersonCameraSystem)) {
			console.log('Remove camera!');
			this.engine.removeSystem(this.engine.getSystem(ThirdPersonCameraSystem));
		}

		const lightEntity = this.query.lights.first;
		const target = this.query.currentTarget.first;

		if (lightEntity && target) {
            const directionalLight = lightEntity.get(DirectionalLight);
            const directionalLightTrasnform = lightEntity.get(Transform);
            const targetPosition = target.get(Transform).position;

			directionalLightTrasnform.position.set(targetPosition.x + 5, 5, targetPosition.z + 5);
			directionalLight.target.position.set(targetPosition.x, 0, targetPosition.z);
		}
	}
}
