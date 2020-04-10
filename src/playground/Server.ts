import { Entity } from '@ecs/ecs/Entity';
import { System } from '@ecs/ecs/System';
import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import ServerPingSystem from '@ecs/plugins/net/systems/ServerPingSystem';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import Position from '@ecs/plugins/Position';
import Space from '@ecs/plugins/space/Space';
import TickerEngine from '@ecs/TickerEngine';
import geckosServer, { GeckosServer } from '@geckos.io/server/lib/server';
import { performance } from 'perf_hooks';
import Hockey from './spaces/Hockey';

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
	constructor(protected generateSnapshot: () => T) {
		super();
	}

	updateFixed(deltaTime: number) {
		console.log(this.generateSnapshot());
	}
}

class ServerHockey extends Hockey {
	setup() {
		super.setup();

		this.addSystem(new SnapshotCompositorSystem(this.generateSnapshot.bind(this)));
	}

	generateSnapshot() {
		const entitySnapshot = (entity: Entity) => {
			let snapshot = {};

			if (entity.get(Position)) {
				snapshot = {
					...snapshot,
					position: entity.get(Position)
				};
			}

			if (entity.has(PhysicsBody)) {
				const physics = entity.get(PhysicsBody);

				snapshot = {
					...snapshot,
					physics: {
						velocity: {
							x: physics.body.velocity.x,
							y: physics.body.velocity.y
						}
					}
				};
			}

			return snapshot;
		};

		return {
			redPaddle: entitySnapshot(this.redPaddle),
			bluePaddle: entitySnapshot(this.bluePaddle),
			puck: entitySnapshot(this.puck)
		};
	}
}

const engine = new NetEngine();
engine.registerSpaces(new ServerHockey(engine));
engine.getSpace('hockey').open();
