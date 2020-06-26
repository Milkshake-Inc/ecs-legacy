import Session from '@ecs/plugins/net/components/Session';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { snapshotUseQuery } from '../../utils/GolfShared';
import { serialize } from '@ecs/plugins/physics/utils/CannonSerialize';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation'
import { Snapshot } from '@geckos.io/snapshot-interpolation/lib/types';

export default class ServerSnapshotSystem extends ServerWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = snapshotUseQuery(this);
	protected snapshotInterpolation: SnapshotInterpolation;

	constructor() {
		super(15);

		this.snapshotInterpolation = new SnapshotInterpolation(15)
	}

	generateSnapshot(): Snapshot {
		const players = this.snapshotQueries.balls.map(entity => {
			const body = entity.get(CannonBody);
			return {
				id: entity.get(Session).id,
				x: body.position.x,
				y: body.position.y,
				z: body.position.z,
			};
		});

		return this.snapshotInterpolation.snapshot.create(players);
	}
}
