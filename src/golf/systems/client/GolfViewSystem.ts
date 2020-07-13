import { useSingletonQuery, useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { Views } from '@ecs/plugins/reactui/View';
import { GolfGameState, GameState } from '../../constants/GolfNetworking';
import Keyboard from '@ecs/input/Keyboard';
import Key from '@ecs/input/Key';
import { all } from '@ecs/utils/QueryHelper';
import PlayerBall from '../../components/PlayerBall';
import Session from '@ecs/plugins/net/components/Session';

export default class GolfViewSystem extends System {

	protected getViews = useSingletonQuery(this, Views);
	protected getGameState = useSingletonQuery(this, GolfGameState);

	protected queries = useQueries(this, {
		localPlayer: all(PlayerBall, Session)
	});

	private keyboard: Keyboard = new Keyboard();

    updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		this.keyboard.update();

		const views = this.getViews();
		const gameState = this.getGameState();

		views.set("lobby", gameState.state == GameState.LOBBY);
		views.set("score", gameState.state == GameState.INGAME && this.keyboard.isDown(Key.Z));
		views.set("power", gameState.state == GameState.INGAME && !!this.queries.localPlayer.first);
    }
}
