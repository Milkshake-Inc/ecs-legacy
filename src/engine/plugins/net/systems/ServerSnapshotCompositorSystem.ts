import { Engine } from '@ecs/ecs/Engine';
import { Query } from '@ecs/ecs/Query';
import { System } from '@ecs/ecs/System';
import { PacketOpcode } from '@ecs/plugins/net/components/Packet';
import { ServerPingState } from '@ecs/plugins/net/components/ServerPingState';
import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import { all, makeQuery } from '@ecs/utils/QueryHelper';

export class SnapshotCompositorSystem<T extends {}> extends System {
	private pingStateQuery: Query;

	constructor(protected connections: ServerConnectionSystem, protected generateSnapshot: () => T) {
		super();
	}

	onAddedToEngine(engine: Engine) {
		engine.addQuery((this.pingStateQuery = makeQuery(all(ServerPingState))));
	}

	updateFixed(deltaTime: number) {
		const { serverTick } = this.pingStateQuery.first.get(ServerPingState);

		this.connections.broadcast({
			opcode: PacketOpcode.WORLD,
			tick: serverTick,
			snapshot: this.generateSnapshot()
		});
	}
}
