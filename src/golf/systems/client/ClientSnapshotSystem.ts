import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useQueries, useSingletonQuery } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import { PacketOpcode, WorldSnapshot } from '@ecs/plugins/net/components/Packet';
import Session from '@ecs/plugins/net/components/Session';
import { useNetworking } from '@ecs/plugins/net/helpers/useNetworking';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { Views } from '@ecs/plugins/reactui/View';
import { all } from '@ecs/utils/QueryHelper';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation';
import { GameState, GolfSnapshotPlayer as GolfSnapshotPlayer, GolfWorldSnapshot, TICK_RATE } from '../../../golf/constants/GolfNetworking';
import GolfPlayer from '../../components/GolfPlayer';
import PlayerBall from '../../components/PlayerBall';
import { createBallClient } from '../../helpers/CreateBall';
import ClientBallControllerSystem from './ClientBallControllerSystem';
import FreeRoamCameraSystem from '@ecs/plugins/3d/systems/FreeRoamCameraSystem';

const findGolfPlayerById = (id: string) => (entity: Entity) => entity.get(GolfPlayer).id == id;
const findEntityBySessionId = (id: string) => (entity: Entity) => entity.has(Session) && entity.get(Session).id == id;

export default class ClientSnapshotSystem extends System {

	protected queries = useQueries(this, {
		players: all(GolfPlayer),
		sessions: all(Session),
	});

	protected network = useNetworking(this)

	protected views = useSingletonQuery(this, Views);

	protected snapshotInterpolation = new SnapshotInterpolation(TICK_RATE)

	constructor(protected engine: Engine) {
		super();

		this.network.on(PacketOpcode.WORLD, (packet) => this.handleWorldUpdate(packet));
	}

	handleWorldUpdate({ snapshot }: WorldSnapshot<GolfWorldSnapshot>) {
		this.snapshotInterpolation.snapshot.add(snapshot.players);

		const views = this.views();

		if(snapshot.state == GameState.LOBBY && this.views().isClosed("lobby")) {
			views.open("lobby");
		}

		if(snapshot.state == GameState.INGAME && this.views().isOpen("lobby")) {
			views.close("lobby");
		}
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
			}
		}

		// Maybe use a state machine here
		// if(playerSnapshot.state == 'spectating' && !this.engine.getSystem(FreeRoamCameraSystem)) {
		// 	console.log("Free Roam")
		// 	this.engine.addSystem(new FreeRoamCameraSystem());
		// }

		if(playerSnapshot.state == 'playing') {
			const body = entity.get(CannonBody);
			body.position.set(playerSnapshot.x, playerSnapshot.y, playerSnapshot.z);
		}
	}

	updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		const interpolatedPlayersSnapshot = this.snapshotInterpolation.calcInterpolation("x y z");

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