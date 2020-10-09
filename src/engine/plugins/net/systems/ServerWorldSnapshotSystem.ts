import { System } from '@ecs/core/System';
import { PacketOpcode } from '@ecs/plugins/net/components/Packet';
import { useBaseNetworking } from '../helpers/useNetworking';

export abstract class ServerWorldSnapshotSystem<S extends {}> extends System {
	protected elaspedMs: number;
	protected updateMs: number;

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

			this.networking.send({
				opcode: PacketOpcode.WORLD,
				tick: 0,
				snapshot: this.generateSnapshot()
			});
		}
	}

	abstract generateSnapshot(): S;
}
