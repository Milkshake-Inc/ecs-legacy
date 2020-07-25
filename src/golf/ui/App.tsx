import { Component, h } from 'preact';
import { Engine } from '@ecs/ecs/Engine';
import { EngineContext } from '@ecs/plugins/ui/react';
import { all } from '@ecs/ecs/Query';
import Transform from '@ecs/plugins/math/Transform';
import PlayerBall from '../components/PlayerBall';
import { Hud } from './Hud';
import { Pos } from './Pos';
import { Ping } from './Ping';
import { Lobby } from './Lobby';
import { Splash } from './Splash';
import { Scoreboard } from './Scoreboard';
import { ViewController, View } from '@ecs/plugins/ui/react/View';
import { PowerBar } from './PowerBar';
import { Spectator } from './Spectator';

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
						<View name='power'>
							<PowerBar />
						</View>
						<View name='spectator' >
							<Spectator />
						</View>
					</Hud>
				</ViewController>
			</EngineContext.Provider>
		);
	}
}
