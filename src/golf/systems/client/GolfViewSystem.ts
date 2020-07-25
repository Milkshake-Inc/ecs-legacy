import { useSingletonQuery, useQueries, useState } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { Views } from '@ecs/plugins/ui/react/View';
import { GolfGameState, GameState } from '../../constants/GolfNetworking';
import Keyboard from '@ecs/plugins/input/Keyboard';
import { all } from '@ecs/ecs/Query';
import PlayerBall from '../../components/PlayerBall';
import Session from '@ecs/plugins/net/components/Session';
import Input from '@ecs/plugins/input/components/Input';
import { Key } from '@ecs/plugins/input/Control';

const ViewInputs = {
	Score: Keyboard.key(Key.Z)
};

export default class GolfViewSystem extends System {
	protected getViews = useSingletonQuery(this, Views);
	protected getGameState = useSingletonQuery(this, GolfGameState);

	protected queries = useQueries(this, {
		localPlayer: all(PlayerBall, Session)
	});

	protected inputs = useState(this, new Input(ViewInputs));

	private keyboard: Keyboard = new Keyboard();

	updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		const inputs = this.inputs.state;

		const views = this.getViews();
		const gameState = this.getGameState();
		const hasLocalPlayer = !!this.queries.localPlayer.first;

		views.set('lobby', gameState.state == GameState.LOBBY);
		views.set('score', gameState.state == GameState.INGAME && inputs.Score.down);
		views.set('power', gameState.state == GameState.INGAME && hasLocalPlayer);
		views.set('spectator', gameState.state == GameState.INGAME && !hasLocalPlayer);
	}
}
