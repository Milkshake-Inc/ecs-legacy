import { System } from '@ecs/core/System';
import { NetworkingCallbacks, useNetworking } from '@ecs/plugins/net/helpers/useNetworking';
import { Engine } from '@ecs/core/Engine';
import { Snapshot } from '@geckos.io/snapshot-interpolation/lib/types';

export const TICK_RATE = 30;

export enum GolfSnapshotPlayerState {
	SPECTATING,
	PLAYING
}

export type GolfSnapshotPlayer = {
	id: string;
	name: string;
	color: number;
	host: number;
	state: GolfSnapshotPlayerState;
	score: number[];
	moving: number;
	x?: number;
	y?: number;
	z?: number;
};

export enum GameState {
	SPLASH,
	LOBBY,
	INGAME,
	SCORE
}

export class GolfGameState {
	state: GameState;
	currentHole: number;
}

export type GolfWorldSnapshot = {
	players: Snapshot;
	entities: Snapshot;
	state: GolfGameState;
};

export type GolfWorldState = {
	players: GolfSnapshotPlayer[];
	state: GameState;
};

export enum GolfPacketOpcode {
	SEND_MAP = 6,
	PREP_SHOOT,
	SHOOT_BALL,
	PUBLIC_ROOMS_REQUEST,
	PUBLIC_ROOMS_RESPONSE,
	CREATE_ROOM_REQUEST,
	CREATE_ROOM_RESPONSE,
	JOIN_ROOM,
	START_GAME,
	POT_BALL,
	SERVER_DEBUG,
	UPDATE_PROFILE
}

export type PublicRoomsRequest = {
	opcode: GolfPacketOpcode.PUBLIC_ROOMS_REQUEST;
};

export type PublicRoomsResponse = {
	opcode: GolfPacketOpcode.PUBLIC_ROOMS_RESPONSE;
	rooms: string[];
};

export type JoinRoom = {
	opcode: GolfPacketOpcode.JOIN_ROOM;
	roomId: string;
};

export type CreateRoomRequest = {
	opcode: GolfPacketOpcode.CREATE_ROOM_REQUEST;
	public: boolean;
};

export type CreateRoomResponse = {
	opcode: GolfPacketOpcode.CREATE_ROOM_RESPONSE;
	roomId: string;
};

export type ShootBall = {
	opcode: GolfPacketOpcode.SHOOT_BALL;
	velocity: {
		x: number;
		z: number;
	};
};

export type PrepShot = {
	opcode: GolfPacketOpcode.PREP_SHOOT;
};

export type StartGame = {
	opcode: GolfPacketOpcode.START_GAME;
};

export type PotBall = {
	opcode: GolfPacketOpcode.POT_BALL;
};

export type ServerDebug = {
	opcode: GolfPacketOpcode.SERVER_DEBUG;
	frameTime: number;
};

export type UpdateProfile = {
	opcode: GolfPacketOpcode.UPDATE_PROFILE;
	name: string;
};

export type GolfPackets =
	| PrepShot
	| ShootBall
	| PublicRoomsRequest
	| PublicRoomsResponse
	| CreateRoomRequest
	| CreateRoomResponse
	| JoinRoom
	| StartGame
	| PotBall
	| ServerDebug
	| UpdateProfile;

export const useGolfNetworking = (system: System | Engine, callbacks?: NetworkingCallbacks) =>
	useNetworking<GolfPacketOpcode, GolfPackets>(system, callbacks);
