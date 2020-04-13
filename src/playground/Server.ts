import { Entity } from '@ecs/ecs/Entity';
import { InputHistory } from '@ecs/plugins/input/components/Input';
import { PlayerInput } from '@ecs/plugins/net/components/Packet';
import Session from '@ecs/plugins/net/components/Session';
import { PlayerInputHandlerSystem } from '@ecs/plugins/net/systems/PacketHandlerSystem';
import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import ServerPingSystem from '@ecs/plugins/net/systems/ServerPingSystem';
import { SnapshotCompositorSystem } from '@ecs/plugins/net/systems/ServerSnapshotCompositorSystem';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import Position from '@ecs/plugins/Position';
import Space from '@ecs/plugins/space/Space';
import TickerEngine from '@ecs/TickerEngine';
import geckosServer, { GeckosServer } from '@geckos.io/server/lib/server';
import { performance } from 'perf_hooks';
import { Paddle } from './components/Paddle';
import Score from './components/Score';
import Hockey, { PaddleSnapshotEntity, PlayerConfig, Snapshot, SnapshotEntity } from './spaces/Hockey';
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

class ServerHockey extends Hockey {
	private connections: ServerConnectionSystem;

	constructor(engine: NetEngine) {
		super(engine);
		this.connections = engine.connections;
	}

	setup() {
		super.setup();

		this.addSystem(new PlayerInputHandlerSystem((e, p) => this.handlePlayerInput(e, p)));
		this.addSystem(new SnapshotCompositorSystem<Snapshot>(this.connections, this.generateSnapshot.bind(this)));

		this.addSystem(new PuckScoreSystem({ width: 1280, height: 720 }));

		this.addSystem(
			new PlayerSpawnSystem(entity => {
				const config = PlayerConfig[this.paddleQuery.entities.length % 2];
				this.createPaddle(entity, config.color, config.spawnPoint);
				entity.add(InputHistory);
			})
		);
	}

	handlePlayerInput(entity: Entity, packet: PlayerInput) {
		const inputHistory = entity.get(InputHistory);
		if (!inputHistory) return;
		inputHistory.inputs[packet.tick] = packet.input;
	}

	generateSnapshot(): Snapshot {
		const entitySnapshot = (entity: Entity): SnapshotEntity => {
			const position = entity.get(Position);
			const physics = entity.get(PhysicsBody);

			return {
				position: {
					x: position.x,
					y: position.y
				},
				velocity: {
					x: physics.body.velocity.x,
					y: physics.body.velocity.y
				}
			};
		};

		const paddleSnapshot = (entity: Entity): PaddleSnapshotEntity => {
			const session = entity.get(Session);
			const paddle = entity.get(Paddle);
			const paddleSnap = entitySnapshot(entity);

			return {
				sessionId: session.id,
				color: paddle.color,
				...paddleSnap
			};
		};

		const score = this.scoreQuery.entities[0].get(Score);

		return {
			paddles: this.paddleQuery.entities.map(paddleSnapshot),
			puck: entitySnapshot(this.puck),
			scores: score
		};
	}
}

const engine = new NetEngine();
engine.registerSpaces(new ServerHockey(engine));
engine.getSpace('hockey').open();
