import { useSingletonQuery } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { Views } from '@ecs/plugins/reactui/View';
import { GolfGameState, GameState } from '../../constants/GolfNetworking';
import Keyboard from '@ecs/input/Keyboard';
import Key from '@ecs/input/Key';
import { Engine } from '@ecs/ecs/Engine';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';

export default class GolfCameraSystem extends System {

    protected engine: Engine;

	protected getGameState = useSingletonQuery(this, GolfGameState);

	private keyboard: Keyboard = new Keyboard();
    private thirdPerson
    constructor(engine: Engine) {
        super();

        this.engine = engine;
    }

    updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		this.keyboard.update();

		const gameState = this.getGameState();

		if(gameState.state == GameState.INGAME && !this.engine.hasSystem(ThirdPersonCameraSystem)) {
            console.log("Create camera!");
            this.engine.addSystem(new ThirdPersonCameraSystem());
        }

        if(gameState.state == GameState.LOBBY && this.engine.hasSystem(ThirdPersonCameraSystem)) {
            console.log("Remove camera!");
            this.engine.removeSystem(this.engine.getSystem(ThirdPersonCameraSystem));
        }
    }
}
