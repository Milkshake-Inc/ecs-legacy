import { getComponentIdByName } from '@ecs/ecs/ComponentId';
import { useQueries, useSingletonQuery } from '@ecs/ecs/helpers';
import { all } from '@ecs/ecs/Query';
import Transform from '@ecs/plugins/math/Transform';
import Session from '@ecs/plugins/net/components/Session';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation';
import GolfPlayer from '../../components/GolfPlayer';
import PlayerBall from '../../components/PlayerBall';
import Synchronize from '../../components/Synchronize';
import { GolfGameState, GolfSnapshotPlayer, GolfSnapshotPlayerState, GolfWorldSnapshot, TICK_RATE } from '../../constants/GolfNetworking';

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

	onRemovedFromEngine() {
		this.gameState = this.snapshotInterpolation = this.snapshotQueries = null;
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

			if (entity.has(Transform)) {
				const { position } = entity.get(Transform);
				// const { moving } = entity.get(AmmoBody);

				result.x = position.x;
				result.y = position.y;
				result.z = position.z;
				result.moving = 0; // TODO good for debug
				// result.moving = moving ? 1 : 0;
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
