import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { QueriesIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import Input, { InputHistory } from '@ecs/plugins/input/components/Input';
import { PacketOpcode, PlayerInput } from '@ecs/plugins/net/components/Packet';
import { ServerPingState } from '@ecs/plugins/net/components/ServerPingState';
import Session from '@ecs/plugins/net/components/Session';
import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import ServerPingSystem, { ServerPingStateQuery } from '@ecs/plugins/net/systems/ServerPingSystem';
import Space from '@ecs/plugins/space/Space';
import TickerEngine from '@ecs/TickerEngine';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import geckosServer, { GeckosServer } from '@geckos.io/server/lib/server';
import { allRandom } from 'dog-names';
import { performance } from 'perf_hooks';
import Hockey, { PlayerConfig } from './spaces/Hockey';
import { HockeyServerWorldSnapshotSystem } from './systems/HockeyServerWorldSnapshotSystem';
import PlayerSpawnSystem from './systems/PlayerSpawnSystem';
import PuckScoreSystem from './systems/PuckScoreSystem';

export class NetEngine extends TickerEngine {
	public server: GeckosServer;
	public connections: ServerConnectionSystem;
	protected spaces: Map<string, Space> = new Map();

	constructor() {
		super(60);

		this.server = geckosServer();

		this.addSystem((this.connections = new ServerConnectionSystem(this, this.server)), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ServerPingSystem(this.tickRate));

		this.server.listen();
	}

	public getSpace(spaceName: string) {
		return this.spaces.get(spaceName);
	}

	public registerSpaces(...spaces: Space[]) {
		spaces.forEach(v => this.spaces.set(v.name, v));
	}

	protected getTime(): number {
		return performance.now();
	}
}

class ServerApplyInputFromHistory extends QueriesIterativeSystem<typeof ServerPingStateQuery> {
	constructor() {
		super(makeQuery(all(Session, Input, InputHistory)), ServerPingStateQuery);
	}

	updateEntityFixed(entity: Entity, dt: number) {
		const input = entity.get(Input);
		const history = entity.get(InputHistory).inputs;
		const { serverTick } = this.queries.serverPing.first.get(ServerPingState)

		if (history[serverTick]) {
			Object.assign(input, history[serverTick]);
		} else {
			// console.log("Don't have input for this frame :(");
		}
	}
}

class ServerAddInputToHistory extends QueriesIterativeSystem<typeof ServerPingStateQuery> {
	constructor() {
		super(makeQuery(all(Session, InputHistory)), ServerPingStateQuery);
	}

	protected entityAdded = (snapshot: EntitySnapshot) => {
		const entity = snapshot.entity;
		const session = entity.get(Session);

		session.socket.handleImmediate(packet => {
			if (packet.opcode == PacketOpcode.PLAYER_INPUT) {
				this.handleInputPacket(entity, packet);
			}
		});
	};

	protected handleInputPacket(entity: Entity, { tick, input }: PlayerInput) {

		const { serverTick } = this.queries.serverPing.first.get(ServerPingState);
		const inputHistory = entity.get(InputHistory);

		const clientAhead = tick - serverTick;

		// console.log(clientAhead + " Client: " + tick + " Server: " + serverTick);

		if (clientAhead < 1) {
			console.log('Client sending old input packets ' + clientAhead);
		}

		if (!inputHistory) {
			console.log('No player input history');
		} else {
			inputHistory.inputs[tick] = input;
		}
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
engine.registerSpaces(new ServerHockey(engine));
engine.getSpace('hockey').open();
