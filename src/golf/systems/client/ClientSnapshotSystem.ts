import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Session from '@ecs/plugins/net/components/Session';
import { ClientBasicWorldSnapshotSystem } from '@ecs/plugins/net/systems/ClientBasicWorldSnapshotSystem';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation';
import { Snapshot } from '@geckos.io/snapshot-interpolation/lib/types';
import { GolfSnapshotPlayer as GolfSnapshotPlayer, TICK_RATE } from '../../../golf/constants/GolfNetworking';
import GolfPlayer from '../../components/GolfPlayer';
import { snapshotUseQuery } from '../../utils/GolfShared';
import PlayerBall from '../../components/PlayerBall';
import { createBallClient } from '../../helpers/CreateBall';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import ClientBallControllerSystem from './ClientBallControllerSystem';
import { useSingletonQuery } from '@ecs/ecs/helpers';
import { Views } from '@ecs/plugins/reactui/View';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';

const findGolfPlayerById = (id: string) => (entity: Entity) => entity.get(GolfPlayer).id == id;
const findEntityBySessionId = (id: string) => (entity: Entity) => entity.has(Session) && entity.get(Session).id == id;

export default class ClientSnapshotSystem extends ClientBasicWorldSnapshotSystem<Snapshot> {

	protected queries = snapshotUseQuery(this);

	protected buildPlayer: (entity: Entity, local: boolean) => void;
	protected snapshotInterpolation = new SnapshotInterpolation(TICK_RATE)

	protected views = useSingletonQuery(this, Views);

	constructor(protected engine: Engine) {
		super();
	}

	applySnapshot(snapshot: Snapshot) {
		this.snapshotInterpolation.snapshot.add(snapshot);
	}

	createDeletePlayers(latestPlayersSnapshot: GolfPlayer[]) {
		const playersToRemove = new Set(this.queries.players.entities);
		const playersToCreate: Entity[] = [];

		for(const playerSnapshot of latestPlayersSnapshot) {
			const existingEntity = this.queries.players.find(findGolfPlayerById(playerSnapshot.id));

			if(existingEntity) {
				playersToRemove.delete(existingEntity)
			} else {
				const localSession = this.queries.sessions.find(findEntityBySessionId(playerSnapshot.id));
				const entity = localSession ? localSession : new Entity();
				entity.add(GolfPlayer, {
					id: playerSnapshot.id,
					color: playerSnapshot.color,
					name: playerSnapshot.name,
				});

				console.log(`🔨  Created new entity ${playerSnapshot.id} local: ${localSession != undefined}`)

				playersToCreate.push(entity);
			}
		}

		return {
			create: playersToCreate,
			remove: playersToRemove
		}
	}

	updatePlayer(entity: Entity, playerSnapshot: GolfSnapshotPlayer) {
		if(playerSnapshot.state == 'playing' && !entity.has(PlayerBall)) {
			console.log("⏫  Upgrading player to ball")

			// Need a nicer way - maybe pass entity in?
			const ballPrefab = createBallClient();
			ballPrefab.components.forEach(component => {
				entity.add(component);
			});

			// Tag up player
			entity.add(PlayerBall);

			const isLocalPlayer = entity.has(Session);

			if (isLocalPlayer) {
				entity.add(ThirdPersonTarget);

				this.engine.addSystem(new ClientBallControllerSystem());
				this.views().close('lobby');
			}
		}

		if(playerSnapshot.state == 'playing') {
			const body = entity.get(CannonBody);
			body.position.set(playerSnapshot.x, playerSnapshot.y, playerSnapshot.z);
		}
	}

	updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		const interpolatedPlayersSnapshot = this.snapshotInterpolation.calcInterpolation("x y z", "players");

		if(interpolatedPlayersSnapshot) {
			const interpolatedPlayerState = interpolatedPlayersSnapshot.state as any as GolfSnapshotPlayer[];

			const result = this.createDeletePlayers(interpolatedPlayerState)
			this.engine.addEntities(...result.create);
			this.engine.removeEntities(...result.remove);

			for(const playerSnapshot of interpolatedPlayerState) {
				const entity = this.queries.players.find(findGolfPlayerById(playerSnapshot.id));

				if(entity) {
					this.updatePlayer(entity, playerSnapshot);
				} else {
					console.log(`🤷‍♀️ Here be dragons`)
				}
			}
		}
	}
}
