import Input from '@ecs/plugins/input/components/Input';
import { InputHistory } from '@ecs/plugins/input/components/InputHistory';
import { ServerAddInputToHistory } from '@ecs/plugins/net/systems/ServerAddInputToHistory';
import { ServerApplyInputFromHistory } from '@ecs/plugins/net/systems/ServerApplyInputFromHistory';
import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import ServerPingSystem from '@ecs/plugins/net/systems/ServerPingSystem';
import TickerEngine from '@ecs/TickerEngine';
import geckosServer, { GeckosServer } from '@geckos.io/server/lib/server';
import { allRandom } from 'dog-names';
import Hockey, { PlayerConfig } from './spaces/Hockey';
import { HockeyServerWorldSnapshotSystem } from './systems/HockeyServerWorldSnapshotSystem';
import PlayerSpawnSystem from './systems/PlayerSpawnSystem';
import PuckScoreSystem from './systems/PuckScoreSystem';
import { Entity } from '@ecs/ecs/Entity';

export class NetEngine extends TickerEngine {
	public server: GeckosServer;
	public connections: ServerConnectionSystem;

	constructor() {
		super(60);

		this.server = geckosServer();

		this.addSystem((this.connections = new ServerConnectionSystem(this, this.server)), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ServerPingSystem(this.tickRate));

		this.server.listen();
	}
}

class ServerHockey extends Hockey {
	private connections: ServerConnectionSystem;

	constructor(engine: NetEngine) {
		super(engine);
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

spaces.add(new ServerHockey(engine));
spaces.get(ServerHockey).open();
