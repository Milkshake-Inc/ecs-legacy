import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { snapshotUseQuery } from '../../utils/GolfShared';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation'
import { Snapshot } from '@geckos.io/snapshot-interpolation/lib/types';
import GolfPlayer from '../../components/GolfPlayer';
import { TICK_RATE, GolfSnapshotState, GolfSnapshotPlayer } from '../../constants/GolfNetworking';

export default class ServerSnapshotSystem extends ServerWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = snapshotUseQuery(this);
	protected snapshotInterpolation: SnapshotInterpolation;

	constructor() {
		super(TICK_RATE);

		this.snapshotInterpolation = new SnapshotInterpolation(TICK_RATE)
	}

	generateSnapshot(): Snapshot {
		const players: GolfSnapshotPlayer[] = this.snapshotQueries.players.map(entity => {

			const player = entity.get(GolfPlayer);

			const result: GolfSnapshotPlayer = {
				id: player.id,
				name: player.name,
				color: player.color,
				state: 'spectating'
			};

			if(entity.has(CannonBody)) {
				const position = entity.get(CannonBody).position;

				result.state = 'playing';
				result.x = position.x;
				result.y = position.y;
				result.z = position.z;
			}

			return result;
		});

		const state: GolfSnapshotState = {
			players,
		}

		return this.snapshotInterpolation.snapshot.create(state);
	}
}
