import { useQueries } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import { PacketOpcode } from '@ecs/plugins/net/components/Packet';
import { encode } from '@msgpack/msgpack';
import Session from '../components/Session';
import { useBaseNetworking } from '../helpers/useNetworking';

export abstract class ServerWorldSnapshotSystem<S extends {}> extends System {
	protected elaspedMs: number;
	protected updateMs: number;

	protected queries = useQueries(this, {
		sessions: all(Session)
	});

	protected networking = useBaseNetworking(this);

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
			};

			const encoded = encode(packet);

			this.networking.sendRaw(encoded);
		}
	}

	abstract generateSnapshot(): S;
}
