import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { System } from '@ecs/ecs/System';
import { useGolfNetworking, GolfPacketOpcode, AllGamesRequest, JoinRoom, StartGame } from './../../constants/GolfNetworking';
import { ServerGolfSpace } from './../../spaces/ServerGolfSpace';
import Session from '@ecs/plugins/net/components/Session';
import { makeQuery, all } from '@ecs/utils/QueryHelper';
import GolfPlayer from '../../../golf/components/GolfPlayer';
import Vector3 from '@ecs/math/Vector';
import PlayerBall from '../../../golf/components/PlayerBall';
import { createBall } from '../../../golf/helpers/CreateBall';

class GolfGameServerEngine extends Engine {

	public space: ServerGolfSpace;

	constructor() {
		super();
		this.space = new ServerGolfSpace(this, true);
	}
}

export class ServerRoomSystem extends System {

	protected networking = useGolfNetworking(this, {
		disconnect: (entity) => this.handleDisconnect(entity)
	})

	protected rooms: Map<string, GolfGameServerEngine>;
	protected entityToRoomEngine: Map<Entity, GolfGameServerEngine>;

	constructor() {
		super();

		this.rooms = new Map();
		this.entityToRoomEngine = new Map();

		this.networking.on(GolfPacketOpcode.ALL_GAMES_REQUEST, this.handleAllGamesRequest.bind(this))
		this.networking.on(GolfPacketOpcode.JOIN_GAME, this.handleJoinGamesRequest.bind(this))
		this.networking.on(GolfPacketOpcode.START_GAME, this.handleStartGame.bind(this))

		this.createRoom("default");
		this.createRoom("lucas");
		this.createRoom("jeff");
	}

	handleDisconnect(entity: Entity): void {
		if(this.entityToRoomEngine.has(entity)) {
			const currentRoom = this.entityToRoomEngine.get(entity);

			currentRoom.removeEntity(entity);
		}
	}

	allRoomIds() {
		return Array.from(this.rooms.keys());
	}

	createRoom(name: string) {
		const newEngine = new GolfGameServerEngine();
		this.rooms.set(name, newEngine);

		console.log(`🏠 Created new room ${name}`);
	}


	handleStartGame(packet: StartGame, entity: Entity) {
		const engine = this.entityToRoomEngine.get(entity);

		const playersQuery = makeQuery(all(GolfPlayer, Session));

		engine.addQuery(playersQuery);

		playersQuery.entities.forEach(entity => {
			const player = createBall(new Vector3(0, 2, 0));
			player.add(PlayerBall);
			console.log('Creating balls');
			player.components.forEach(c => {
				entity.add(c);
			});
		});
		// Start game some how
		// Add systems?
	}

	handleAllGamesRequest(packet: AllGamesRequest, entity: Entity) {
		this.networking.sendTo(entity, {
			opcode: GolfPacketOpcode.ALL_GAMES_RESPONSE,
			games: this.allRoomIds(),
		});
	}

	handleJoinGamesRequest(packet: JoinRoom, entity: Entity) {
		if(this.entityToRoomEngine.has(entity)) {
			const currentRoom = this.entityToRoomEngine.get(entity);

			currentRoom.removeEntity(entity);
		}

		if(this.rooms.has(packet.roomId)) {
			const newRoom = this.rooms.get(packet.roomId);


			newRoom.addEntity(entity);
			this.entityToRoomEngine.set(entity, newRoom);
		}

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