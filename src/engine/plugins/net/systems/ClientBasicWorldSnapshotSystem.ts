import { Entity } from '@ecs/ecs/Entity';
import { Queries, QueriesIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import { any, makeQuery } from '@ecs/utils/QueryHelper';
import { PacketOpcode, WorldSnapshot } from '../components/Packet';
import Session from '../components/Session';

export abstract class ClientBasicWorldSnapshotSystem<TSnapshot extends {}, TQueries extends Queries = {}> extends QueriesIterativeSystem<
	TQueries
> {
	constructor(queries: TQueries) {
		super(makeQuery(any(Session)), queries);
	}

	abstract applySnapshot(snapshot: TSnapshot): void;
	abstract createEntitiesFromSnapshot(snapshot: TSnapshot): void;

	updateEntityFixed(entity: Entity, deltaTime: number) {
		// Handle world packets
		const session = entity.get(Session);
		const packets = session.socket.handle<WorldSnapshot<TSnapshot>>(PacketOpcode.WORLD);

		if (packets.length > 0) {
			this.updateSnapshot(packets.pop());
		}
	}

	updateSnapshot({ snapshot }: WorldSnapshot<TSnapshot>) {
		this.createEntitiesFromSnapshot(snapshot);

		this.applySnapshot(snapshot);
	}
}
