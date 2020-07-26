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
import { ConnectionStatistics } from '@ecs/plugins/net/systems/ClientConnectionSystem';

const ViewInputs = {
	Score: Keyboard.key(Key.Z)
};

export default class GolfViewSystem extends System {
	protected getViews = useSingletonQuery(this, Views);
	protected getGameState = useSingletonQuery(this, GolfGameState);
	protected getConnectionState = useSingletonQuery(this, ConnectionStatistics);

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
		const connected = this.getConnectionState().connected;

		views.set('splash', connected && gameState.state == GameState.SPLASH);
		views.set('lobby', connected && gameState.state == GameState.LOBBY);
		views.set('score', connected && gameState.state == GameState.INGAME && inputs.Score.down);
		views.set('power', connected && gameState.state == GameState.INGAME && hasLocalPlayer);
		views.set('spectator', connected && gameState.state == GameState.INGAME && !hasLocalPlayer);
		views.set('connecting', !connected);
	}
}
