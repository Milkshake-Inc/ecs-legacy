import { System } from 'tick-knock';
import { PacketOpcode, WorldSnapshot } from '../components/Packet';
import { useBaseNetworking } from '../helpers/useNetworking';

export abstract class ClientBasicWorldSnapshotSystem<TSnapshot extends {}> extends System {
	protected networking = useBaseNetworking(this);

	constructor() {
		super();

		this.networking.on(PacketOpcode.WORLD, this.updateSnapshot.bind(this));
	}

	abstract applySnapshot(snapshot: TSnapshot): void;

	updateSnapshot({ snapshot }: WorldSnapshot<TSnapshot>) {
		this.applySnapshot(snapshot);
	}
}
