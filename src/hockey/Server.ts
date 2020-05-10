import { NetEngine } from '@ecs/plugins/net/NetEngine';
import Input from '@ecs/plugins/input/components/Input';
import { InputHistory } from '@ecs/plugins/input/components/InputHistory';
import { ServerAddInputToHistory } from '@ecs/plugins/net/systems/ServerAddInputToHistory';
import { ServerApplyInputFromHistory } from '@ecs/plugins/net/systems/ServerApplyInputFromHistory';
import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import { allRandom } from 'dog-names';
import Hockey, { PlayerConfig } from './spaces/Hockey';
import { HockeyServerWorldSnapshotSystem } from './systems/HockeyServerWorldSnapshotSystem';
import PlayerSpawnSystem from './systems/PlayerSpawnSystem';
import PuckScoreSystem from './systems/PuckScoreSystem';
import { Entity } from '@ecs/ecs/Entity';

class ServerHockey extends Hockey {
	private connections: ServerConnectionSystem;

	constructor(engine: NetEngine, open = false) {
		super(engine, open);
		this.connections = engine.connections;
	}

	setup() {
		this.addSystem(new ServerApplyInputFromHistory());

		super.setup();

		this.addSystem(new ServerAddInputToHistory());
		this.addSystem(new HockeyServerWorldSnapshotSystem());

		this.addSystem(new PuckScoreSystem({ width: 1280, height: 720 }));

		this.addSystem(
			new PlayerSpawnSystem(entity => {
				const config = PlayerConfig[this.paddleQuery.entities.length % 2];
				this.createPaddle(entity, allRandom(), config.color, config.spawnPoint);
				entity.add(Input);
				entity.add(InputHistory);
			})
		);
	}
}

const engine = new NetEngine();
const spaces = new Entity();
engine.addEntity(spaces);

spaces.add(new ServerHockey(engine, true));
