import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { PacketOpcode } from '@ecs/plugins/net/components/Packet';
import { ServerPingState } from '@ecs/plugins/net/components/ServerPingState';
import { ServerConnectionState } from '@ecs/plugins/net/systems/ServerConnectionSystem';
import { all } from '@ecs/utils/QueryHelper';

export abstract class ServerWorldSnapshotSystem<S extends {}> extends System {
	protected queries = useQueries(this, {
		serverPing: all(ServerPingState),
		serverConnection: all(ServerConnectionState)
	});

	public updateFixed(deltaTime: number) {
		const { serverTick } = this.serverPingState;
		const { broadcast } = this.serverConnectionState;

		broadcast({
			opcode: PacketOpcode.WORLD,
			tick: serverTick,
			snapshot: this.generateSnapshot()
		});
	}

	abstract generateSnapshot(): S;

	protected get serverPingState() {
		return this.queries.serverPing.first.get(ServerPingState);
	}

	protected get serverConnectionState() {
		return this.queries.serverConnection.first.get(ServerConnectionState);
	}
}
