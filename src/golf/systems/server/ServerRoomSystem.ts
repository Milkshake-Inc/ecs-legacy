import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useQueries, useState } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Session from '@ecs/plugins/net/components/Session';
import { all } from '@ecs/ecs/Query';
import GolfPlayer from '../../../golf/components/GolfPlayer';
import PlayerBall from '../../../golf/components/PlayerBall';
import { createBall } from '../../utils/CreateBall';
import {
	PublicRoomsRequest,
	GameState,
	GolfPacketOpcode,
	JoinRoom,
	StartGame,
	useGolfNetworking,
	GolfGameState,
	CreateRoomRequest,
	UpdateProfile
} from './../../constants/GolfNetworking';
import { ServerGolfSpace } from './../../spaces/ServerGolfSpace';
import Spawn from '../../../golf/components/Spawn';
import shortid from 'shortid';
import CannonBody from '@ecs/plugins/physics/3d/components/CannonBody';

class GolfGameServerEngine extends Engine {
	public space: ServerGolfSpace;
	public name: string;

	private playerQueries = useQueries(this, {
		players: all(GolfPlayer, Session),
		balls: all(PlayerBall, Session),
		spawn: all(Spawn)
	});

	private networking = useGolfNetworking(this);

	private state = useState(this, new GolfGameState(), {
		state: GameState.LOBBY,
		currentHole: 0
	});

	get isEmpty() {
		return this.playerQueries.players.length <= 0;
	}

	get spawns() {
		return this.playerQueries.spawn.map(s => s.get(Spawn)).sort((a, b) => a.index - b.index);
	}

	constructor(name: string) {
		super();

		this.name = name;
		this.space = new ServerGolfSpace(this, true);
		this.networking.on(GolfPacketOpcode.START_GAME, this.handleStartGame.bind(this));
	}

	handleStartGame(packet: StartGame, entity: Entity) {
		// Ignore if they aren't the host
		if (!entity.get(GolfPlayer).host) return;

		this.state.currentHole = 0;
		this.nextHole();
	}

	nextHole() {
		if (this.state.currentHole > this.playerQueries.spawn.length || !this.spawns[this.state.currentHole]) {
			console.log(`🏠  Game End`);
			this.state.state = GameState.LOBBY;
			return;
		}

		this.playerQueries.players.entities.forEach(entity => {
			if (!entity.has(CannonBody)) {
				console.log('Creating ball');
				const player = createBall();
				player.components.forEach(c => {
					entity.add(c);
				});
			}

			entity.add(PlayerBall);
			entity.get(CannonBody).setPosition(this.spawns[this.state.currentHole].position);
		});

		this.state.state = GameState.INGAME;
	}

	updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		if (this.state.state == GameState.INGAME) {
			if (this.playerQueries.players.length == 0) {
				console.log(`🏠  Reset lobby`);
				this.state.state = GameState.LOBBY;
			}

			if (this.playerQueries.balls.length == 0) {
				console.log(`All players finished`);
				this.state.state = GameState.SCORE;

				setTimeout(() => {
					this.state.currentHole++;
					this.nextHole();
				}, 3000);
				this.state.currentHole;
			}
		}

		const host = this.playerQueries.players.first;
		if (host) {
			host.get(GolfPlayer).host = 1;
		}
	}
}

export class ServerRoomSystem extends System {
	protected networking = useGolfNetworking(this, {
		connect: entity => this.handleConnect(entity),
		disconnect: entity => this.handleDisconnect(entity)
	});

	protected rooms: Map<string, GolfGameServerEngine> = new Map();
	protected publicRooms: Set<string> = new Set();
	protected entityToRoomEngine: Map<Entity, GolfGameServerEngine> = new Map();

	constructor() {
		super();

		this.networking.on(GolfPacketOpcode.PUBLIC_ROOMS_REQUEST, this.handleAllGamesRequest.bind(this));
		this.networking.on(GolfPacketOpcode.CREATE_ROOM_REQUEST, this.handleCreateRoomRequest.bind(this));
		this.networking.on(GolfPacketOpcode.JOIN_ROOM, this.handleJoinRoomRequest.bind(this));
		this.networking.on(GolfPacketOpcode.UPDATE_PROFILE, this.handleUpdateProfileRequest.bind(this));

		this.createRoom('default');
		this.createRoom('lucas');
		this.createRoom('jeff');
	}

	handleConnect(entity: Entity): void {
		// TODO Persist golfplayer against sessionId?
		const session = entity.get(Session);
		entity.add(new GolfPlayer(session.id));
	}

	handleDisconnect(entity: Entity): void {
		if (this.entityToRoomEngine.has(entity)) {
			const currentRoom = this.entityToRoomEngine.get(entity);

			currentRoom.removeEntity(entity);

			this.cleanupEmptyRoom(currentRoom);
		}
	}

	allRoomIds() {
		return Array.from(this.publicRooms.keys());
	}

	createRoom(name: string, isPublic = true) {
		const newEngine = new GolfGameServerEngine(name);
		this.rooms.set(name, newEngine);
		if (isPublic) {
			this.publicRooms.add(name);
		}

		console.log(`🏠 Created new room ${name}`);
	}

	handleAllGamesRequest(packet: PublicRoomsRequest, entity: Entity) {
		this.networking.sendTo(entity, {
			opcode: GolfPacketOpcode.PUBLIC_ROOMS_RESPONSE,
			rooms: this.allRoomIds()
		});
	}

	handleCreateRoomRequest(packet: CreateRoomRequest, entity: Entity) {
		const roomId = shortid.generate().slice(0, 4).toUpperCase();
		this.createRoom(roomId, packet.public);

		this.networking.sendTo(entity, {
			opcode: GolfPacketOpcode.CREATE_ROOM_RESPONSE,
			roomId
		});
	}

	handleJoinRoomRequest(packet: JoinRoom, entity: Entity) {
		// remove from old room
		if (this.entityToRoomEngine.has(entity)) {
			const currentRoom = this.entityToRoomEngine.get(entity);

			currentRoom.removeEntity(entity);
		}

		// add to new room
		if (this.rooms.has(packet.roomId)) {
			const newRoom = this.rooms.get(packet.roomId);

			newRoom.addEntity(entity);
			this.entityToRoomEngine.set(entity, newRoom);
		} else {
			console.warn(`room ${packet.roomId} not found`);
		}
	}

	handleUpdateProfileRequest(packet: UpdateProfile, entity: Entity) {
		if (packet.name.length > 0) {
			const player = entity.get(GolfPlayer);
			if (player) {
				player.name = packet.name;
			}
		}
	}

	cleanupEmptyRoom(room: GolfGameServerEngine) {
		if (room.isEmpty && !this.publicRooms.has(room.name)) {
			this.rooms.delete(room.name);
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

	updateLate(deltaTime: number) {
		for (const room of this.rooms.values()) {
			room.updateLate(deltaTime);
		}
	}

	updateRender(deltaTime: number) {
		for (const room of this.rooms.values()) {
			room.updateRender(deltaTime);
		}
	}
}
