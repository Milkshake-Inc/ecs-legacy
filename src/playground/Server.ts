import { Entity } from '@ecs/ecs/Entity';
import { System } from '@ecs/ecs/System';
import { PacketOpcode, PlayerInput } from '@ecs/plugins/net/components/Packet';
import Session from '@ecs/plugins/net/components/Session';
import { PlayerInputHandlerSystem } from '@ecs/plugins/net/systems/PacketHandlerSystem';
import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import ServerPingSystem from '@ecs/plugins/net/systems/ServerPingSystem';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import Position from '@ecs/plugins/Position';
import Space from '@ecs/plugins/space/Space';
import TickerEngine from '@ecs/TickerEngine';
import geckosServer, { GeckosServer } from '@geckos.io/server/lib/server';
import { performance } from 'perf_hooks';
import Hockey, { PlayerColor, Snapshot, SnapshotEntity } from './spaces/Hockey';
import PlayerSpawnSystem from './systems/PlayerSpawnSystem';
import { InputHistory } from '@ecs/plugins/input/components/Input';

export class NetEngine extends TickerEngine {
	public server: GeckosServer;
	public connections: ServerConnectionSystem;
	protected spaces: Map<string, Space> = new Map();

	constructor() {
		super(60);

		this.server = geckosServer();

		this.addSystem((this.connections = new ServerConnectionSystem(this, this.server)), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ServerPingSystem(this.connections));

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

class SnapshotCompositorSystem<T extends {}> extends System {
	constructor(protected connections: ServerConnectionSystem, protected generateSnapshot: () => T) {
		super();
	}

	updateFixed(deltaTime: number) {
		this.connections.broadcast({
			opcode: PacketOpcode.WORLD,
			snapshot: this.generateSnapshot()
		});
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

		this.addSystem(
			new PlayerSpawnSystem(entity => {
				this.createPaddle(entity, PlayerColor.Red, { x: 100, y: 100 });
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

		const paddleSnapshot = (entity: Entity): SnapshotEntity & { sessionId: string } => {
			const session = entity.get(Session);
			const paddleSnap = entitySnapshot(entity);

			return {
				sessionId: session.id,
				...paddleSnap
			};
		};

		return {
			paddles: this.paddleQuery.entities.map(paddleSnapshot),
			puck: entitySnapshot(this.puck)
		};
	}
}

const engine = new NetEngine();
engine.registerSpaces(new ServerHockey(engine));
engine.getSpace('hockey').open();
