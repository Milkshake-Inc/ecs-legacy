import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { PacketOpcode } from '@ecs/plugins/net/components/Packet';
import { ServerPingState } from '@ecs/plugins/net/components/ServerPingState';
import { ServerConnectionState } from '@ecs/plugins/net/systems/ServerConnectionSystem';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Session from '../components/Session';

export abstract class ServerWorldSnapshotSystem<S extends {}> extends System {

	protected queries = useQueries(this, {
		sessions: all(Session)
	});

	protected elaspedMs: number;
	protected updateMs: number;

	constructor(updateRate = 60) {
		super();

		this.elaspedMs = 0;
		this.updateMs = 1000 / updateRate;
	}

	public updateFixed(deltaTime: number) {
		this.elaspedMs += deltaTime;

		if (this.elaspedMs >= this.updateMs) {
			this.elaspedMs -= this.updateMs;

			const packet = {
				opcode: PacketOpcode.WORLD,
				tick: 0,
				snapshot: this.generateSnapshot()
			}

			this.queries.sessions.forEach(entity => {
				const session = entity.get(Session);
				session.socket.send(packet)
			});
		}
	}

	abstract generateSnapshot(): S;
}
