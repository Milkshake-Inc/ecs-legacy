import { Component, h } from 'preact';
import { Engine } from '@ecs/ecs/Engine';
import { EngineContext } from '@ecs/plugins/reactui';
import { all } from '@ecs/utils/QueryHelper';
import Transform from '@ecs/plugins/Transform';
import PlayerBall from '../components/PlayerBall';
import { Hud } from './Hud';
import { Pos } from './Pos';
import { Ping } from './Ping';

export default class App extends Component<{ engine: Engine }> {
	render() {
		return (
			<EngineContext.Provider value={this.props.engine}>
				<Hud>
					<Pos query={all(Transform, PlayerBall)} />
					<Ping />
				</Hud>
			</EngineContext.Provider>
		);
	}
}
