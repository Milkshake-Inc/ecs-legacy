import Session from '@ecs/plugins/net/components/Session';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { snapshotUseQuery, Snapshot } from '../Shared';
import { serialize } from '../utils/CannonSerialize';

export default class ServerSnapshotSystem extends ServerWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = snapshotUseQuery(this);

	generateSnapshot(): Snapshot {
		const boat = this.snapshotQueries.boats.first;
		const body = boat.get(CannonBody);

		const players = this.snapshotQueries.players.map(entity => {
			return {
				id: entity.get(Session).id,
				snap: serialize(entity.get(CannonBody))
			};
		});

		return {
			boat: serialize(body),
			players
		};
	}
}
