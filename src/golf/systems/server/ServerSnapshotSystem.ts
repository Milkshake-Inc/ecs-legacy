import { useSingletonQuery, useQueries } from '@ecs/ecs/helpers';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/3d/components/CannonBody';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation';
import GolfPlayer from '../../components/GolfPlayer';
import { GolfSnapshotPlayer, GolfWorldSnapshot, TICK_RATE, GolfGameState, GolfSnapshotPlayerState } from '../../constants/GolfNetworking';
import { all } from '@ecs/ecs/Query';
import Session from '@ecs/plugins/net/components/Session';
import Synchronize from '../../components/Synchronize';
import { getComponentIdByName } from '@ecs/ecs/ComponentId';
import PlayerBall from '../../components/PlayerBall';

export default class ServerSnapshotSystem extends ServerWorldSnapshotSystem<GolfWorldSnapshot> {
	protected snapshotQueries = useQueries(this, {
		players: all(GolfPlayer),
		sessions: all(Session),
		entities: all(Synchronize)
	});

	protected snapshotInterpolation: SnapshotInterpolation;

	protected gameState = useSingletonQuery(this, GolfGameState);

	constructor() {
		super(TICK_RATE);

		this.snapshotInterpolation = new SnapshotInterpolation(TICK_RATE);
	}

	generateSnapshot(): GolfWorldSnapshot {
		const players: GolfSnapshotPlayer[] = this.snapshotQueries.players.map(entity => {
			const player = entity.get(GolfPlayer);

			const result: GolfSnapshotPlayer = {
				id: player.id,
				name: player.name,
				color: player.color,
				host: player.host,
				score: player.score,
				state: GolfSnapshotPlayerState.SPECTATING,
				moving: 0
			};

			if (entity.has(CannonBody)) {
				const body = entity.get(CannonBody);
				const position = body.position;

				result.x = position.x;
				result.y = position.y;
				result.z = position.z;
				result.moving = body.moving ? 1 : 0;
			}

			if (entity.has(PlayerBall)) {
				result.state = GolfSnapshotPlayerState.PLAYING;
			}

			return result;
		});

		const entities = this.snapshotQueries.entities.map(entity => {
			const synchronize = entity.get(Synchronize);

			const builtSync = {};

			Object.keys(synchronize.components).forEach(componentName => {
				const component = entity.components.get(getComponentIdByName(componentName));
				builtSync[componentName] = JSON.parse(JSON.stringify(component));
			});

			return {
				id: synchronize.id,
				components: builtSync
			};
		});

		return {
			players: this.snapshotInterpolation.snapshot.create(players as any),
			state: this.gameState(),
			entities: this.snapshotInterpolation.snapshot.create(entities as any)
		};
	}
}
