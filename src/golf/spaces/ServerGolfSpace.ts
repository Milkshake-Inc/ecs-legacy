import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import CoursePiece from '../components/CoursePice';
import { KenneyAssetsGLTF } from '../components/GolfAssets';
import { GolfPacketOpcode, useGolfNetworking } from '../constants/GolfNetworking';
import { Maps } from '../constants/Maps';
import ServerSnapshotSystem from '../systems/server/ServerSnapshotSystem';
import { buildCourcePieceEntity } from '../utils/CourcePiece';
import { deserializeMap, serializeMap } from '../utils/Serialization';
import BaseGolfSpace from './BaseGolfSpace';
import { PlayerSpawnSystem } from '../utils/GolfShared';
import PlayerBall from '../components/PlayerBall';
import { ServerBallControllerSystem } from '../systems/server/ServerBallControllerSystem';
import Vector3 from '@ecs/math/Vector';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';

export default class ServerGolfSpace extends BaseGolfSpace {
	constructor(engine: Engine, open = false) {
		super(engine, open);
	}

	setup() {
		this.addSystem(new CannonPhysicsSystem(new Vector3(0, -5, 0), 1, false, 3));
		super.setup();

		this.addSystem(new ServerMapSystem(this.golfAssets.gltfs));

		this.addSystem(
			new PlayerSpawnSystem(entity => {
				const player = this.createBall(new Vector3(0, 2, 0));
				player.add(PlayerBall);
				console.log('Created');
				player.components.forEach(c => {
					entity.add(c);
				});
			})
		);

		this.addSystem(new ServerBallControllerSystem());
		this.addSystem(new ServerSnapshotSystem());
	}
}

class ServerMapSystem extends System {
	network = useGolfNetworking(this, {
		connect: e => this.handleConnection(e)
	});

	protected queries = useQueries(this, {
		pieces: all(CoursePiece)
	});

	protected assets: KenneyAssetsGLTF;
	protected engine: Engine;

	constructor(assets: KenneyAssetsGLTF) {
		super();

		this.assets = assets;

		this.network.on(GolfPacketOpcode.PLACE_PART, (packet, entity) => {
			// Broadcast
			const transform = Transform.From(packet.data.transform);
			this.engine.addEntities(buildCourcePieceEntity(assets, packet.data.modelName, transform));
			this.network.sendExcept(entity, packet);
		});
	}

	public onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);

		this.engine = engine;

		engine.addEntities(...deserializeMap(this.assets, Maps.DefaultMap));
	}

	handleConnection(entity: Entity) {
		this.network.sendTo(
			entity,
			{
				opcode: GolfPacketOpcode.SEND_MAP,
				data: serializeMap(this.queries.pieces),
				name: 'Default Map'
			},
			true
		);
	}
}
