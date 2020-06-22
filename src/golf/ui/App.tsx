import { Component, h } from 'preact';
import { Engine } from '@ecs/ecs/Engine';
import { EngineContext } from '@ecs/plugins/reactui';
import { Hud } from './hud';

export default class App extends Component<{ engine: Engine }> {
	render() {
		return (
			<EngineContext.Provider value={this.props.engine}>
				<Hud />
			</EngineContext.Provider>
		);
	}
}
