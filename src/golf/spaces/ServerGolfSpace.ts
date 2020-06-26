import { Engine } from '@ecs/ecs/Engine';
import { System } from '@ecs/ecs/System';
import Vector3 from '@ecs/math/Vector';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import BaseGolfSpace from './BaseGolfSpace';
import { ServerBallControllerSystem } from '../systems/server/ServerBallControllerSystem';
import ServerSnapshotSystem from '../systems/server/ServerSnapshotSystem';
import { PlayerSpawnSystem } from '../utils/GolfShared';
import PlayerBall from '../components/PlayerBall';
import { useNetworking } from '@ecs/plugins/net/helpers/useNetworking';
import { useGolfNetworking, GolfPacketOpcode, AllGamesRequest, JoinRoom } from '../constants/GolfNetworking';
import { Entity } from '@ecs/ecs/Entity';
import Session from '@ecs/plugins/net/components/Session';

export class GolfRoomSystem extends System {


	protected networking = useGolfNetworking(this, {
		connect: (entity) => {
			console.log("New Entity: " + entity);

		},

	})

	protected rooms: Map<string, Engine> = new Map();

	constructor() {
		super();

		this.networking.on(GolfPacketOpcode.ALL_GAMES_REQUEST, this.handleAllGamesRequest.bind(this))
		this.networking.on(GolfPacketOpcode.JOIN_GAME, this.handleJoinGamesRequest.bind(this))

		this.createRoom("default");
		this.createRoom("lucas");
		this.createRoom("jeff");
	}

	allRoomIds() {
		return Array.from(this.rooms.keys());
	}

	createRoom(name: string) {
		const newEngine = new Engine();
		new ServerGolfSpace(newEngine, true);
		this.rooms.set(name, newEngine);

		console.log(`🏠 Created new room ${name}`);
	}

	handleAllGamesRequest(packet: AllGamesRequest, entity: Entity) {
		this.networking.sendTo(entity, {
			opcode: GolfPacketOpcode.ALL_GAMES_RESPONSE,
			games: this.allRoomIds(),
		});
	}

	handleJoinGamesRequest(packet: JoinRoom, entity: Entity) {
		this.rooms.get(packet.roomId).addEntity(entity);
	}

	update(deltaTime: number) {
		for (const room of this.rooms.values()) {
			// Check players
			room.update(deltaTime);
		}
	}

	updateFixed(deltaTime: number) {
		for (const room of this.rooms.values()) {
			room.updateFixed(deltaTime);
		}
	}
}

class ServerGolfSpace extends BaseGolfSpace {
	constructor(engine: Engine, open = false) {
		super(engine, open);

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

		this.addSystem(new CannonPhysicsSystem(new Vector3(0, -5, 0), 1, false, 3));
		this.addSystem(new ServerBallControllerSystem());
		this.addSystem(new ServerSnapshotSystem());
	}
}


