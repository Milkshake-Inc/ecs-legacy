import { Component, h } from 'preact';
import { Engine } from '@ecs/ecs/Engine';
import { EngineContext } from '@ecs/plugins/reactui';
import { all } from '@ecs/utils/QueryHelper';
import Transform from '@ecs/plugins/Transform';
import PlayerBall from '../components/PlayerBall';
import { Hud } from './Hud';
import { Pos } from './Pos';
import { Ping } from './Ping';
import { Lobby } from './Lobby';
import { Splash } from './Splash';
import { Scoreboard } from './Scoreboard';
import { ViewController, View } from '@ecs/plugins/reactui/View';

export default class App extends Component<{ engine: Engine }, { visible: true }> {
	render() {
		return (
			<EngineContext.Provider value={this.props.engine}>
				<ViewController>
					<Hud>
						<View name='debug'>
							<Pos query={all(Transform, PlayerBall)} />
							<Ping />
						</View>
						<View name='splash'>
							<Splash />
						</View>
						<View name='score'>
							<Scoreboard />
						</View>
						<View name='lobby'>
							<Lobby />
						</View>
					</Hud>
				</ViewController>
			</EngineContext.Provider>
		);
	}
}
