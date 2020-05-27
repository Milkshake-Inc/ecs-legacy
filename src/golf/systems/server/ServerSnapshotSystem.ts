import Session from '@ecs/plugins/net/components/Session';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { Snapshot, snapshotUseQuery } from '../../utils/GolfShared';
import { serialize } from '@ecs/plugins/physics/utils/CannonSerialize';

export default class ServerSnapshotSystem extends ServerWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = snapshotUseQuery(this);

	constructor() {
		super(30);
	}

	generateSnapshot(): Snapshot {
		const players = this.snapshotQueries.balls.map(entity => {
			return {
				id: entity.get(Session).id,
				snap: serialize(entity.get(CannonBody))
			};
		});

		return {
			balls: players
		};
	}
}
