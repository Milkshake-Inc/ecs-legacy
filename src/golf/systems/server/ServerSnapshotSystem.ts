import { useSingletonQuery } from '@ecs/ecs/helpers';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation';
import GolfPlayer from '../../components/GolfPlayer';
import { GolfSnapshotPlayer, GolfWorldSnapshot, TICK_RATE } from '../../constants/GolfNetworking';
import { snapshotUseQuery } from '../../utils/GolfShared';
import { GolfGameState } from './ServerRoomSystem';

export default class ServerSnapshotSystem extends ServerWorldSnapshotSystem<GolfWorldSnapshot> {
	protected snapshotQueries = snapshotUseQuery(this);
	protected snapshotInterpolation: SnapshotInterpolation;

	protected gameState = useSingletonQuery(this, GolfGameState);

	constructor() {
		super(TICK_RATE);

		this.snapshotInterpolation = new SnapshotInterpolation(TICK_RATE)
	}

	generateSnapshot(): GolfWorldSnapshot {
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

		return {
			players: this.snapshotInterpolation.snapshot.create(players),
			state: this.gameState().ingame,
		};
	}
}
