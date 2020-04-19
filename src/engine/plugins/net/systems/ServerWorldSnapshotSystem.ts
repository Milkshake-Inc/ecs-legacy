import { QueriesSystem, Queries } from '@ecs/ecs/helpers/StatefulSystems';
import { PacketOpcode } from '@ecs/plugins/net/components/Packet';
import { ServerPingState } from '@ecs/plugins/net/components/ServerPingState';
import { ServerConnectionQuery, ServerConnectionState } from '@ecs/plugins/net/systems/ServerConnectionSystem';
import { ServerPingStateQuery } from '@ecs/plugins/net/systems/ServerPingSystem';

export abstract class ServerWorldSnapshotSystem<S extends {}, Q extends Queries> extends QueriesSystem<
	typeof ServerConnectionQuery & typeof ServerPingStateQuery & Q
> {
	constructor(query: Q) {
		super({
			...ServerConnectionQuery,
			...ServerPingStateQuery,
			...query
		});
	}

	public updateFixed(deltaTime: number) {
		const { serverTick } = this.serverPingState;
		const { broadcast } = this.serverConnectionState;

		broadcast(
			{
				opcode: PacketOpcode.WORLD,
				tick: serverTick,
				snapshot: this.generateSnapshot()
			},
			true
		);
	}

	abstract generateSnapshot(): S;

	protected get serverPingState() {
		return this.queries.serverPing.first.get(ServerPingState);
	}

	protected get serverConnectionState() {
		return this.queries.serverConnection.first.get(ServerConnectionState);
	}
}
