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
import { useState } from 'preact/hooks';

export default class App extends Component<{ engine: Engine }, { visible: true }> {
	public static TOGGLE_LOBBY: () => void;

	constructor() {
		super()

		App.TOGGLE_LOBBY = () => this.setState({
			visible: true
		});
	}

	render() {

		return (
			<EngineContext.Provider value={this.props.engine}>
				<Hud>
					{/* <Pos query={all(Transform, PlayerBall)} /> */}
					{/* <Ping /> */}
					{ this.state.visible && <Lobby /> }
					{/* <Splash /> */}
					{/* <Scoreboard /> */}
				</Hud>
			</EngineContext.Provider>
		);
	}
}
