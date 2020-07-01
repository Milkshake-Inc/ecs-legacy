import Session from '@ecs/plugins/net/components/Session';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { snapshotUseQuery } from '../../utils/GolfShared';
import { serialize } from '@ecs/plugins/physics/utils/CannonSerialize';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation'
import { Snapshot } from '@geckos.io/snapshot-interpolation/lib/types';
import GolfPlayer from '../../components/GolfPlayer';

export default class ServerSnapshotSystem extends ServerWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = snapshotUseQuery(this);
	protected snapshotInterpolation: SnapshotInterpolation;

	constructor() {
		super(15);

		this.snapshotInterpolation = new SnapshotInterpolation(15)
	}

	generateSnapshot(): Snapshot {
		const players = this.snapshotQueries.players.map(entity => {
			const body = entity.get(Session);
			const result = {
				id: entity.get(GolfPlayer).id,
				name: entity.get(GolfPlayer).name,
				color: entity.get(GolfPlayer).color,
			};

			if(entity.has(CannonBody)) {
				const position = entity.get(CannonBody).position;
				result['position'] = {
					x: position.x,
					y: position.y,
					z: position.z
				};
			}

			return result;
		});

		return this.snapshotInterpolation.snapshot.create(players);
	}
}
