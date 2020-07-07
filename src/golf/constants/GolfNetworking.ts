import { System } from '@ecs/ecs/System';
import { NetworkingCallbacks, useNetworking } from '@ecs/plugins/net/helpers/useNetworking';
import { Engine } from '@ecs/ecs/Engine';
import { Snapshot } from '@geckos.io/snapshot-interpolation/lib/types';

export const TICK_RATE = 30;

export type GolfSnapshotPlayer = {
	id: string;
	name: string;
	color: number;
	state: 'spectating' | 'playing';
	x?: number;
	y?: number;
	z?: number;
};

export enum GameState {
	LOBBY,
	INGAME
}

export class GolfGameState {
	state: GameState
}


export type GolfWorldSnapshot = {
	players: Snapshot;
	state: GolfGameState;
}

export type GolfWorldState = {
	players: GolfSnapshotPlayer[];
	state: GameState;
};

export enum GolfPacketOpcode {
	SEND_MAP = 6,
	PREP_SHOOT,
	SHOOT_BALL,
	ALL_GAMES_REQUEST,
	ALL_GAMES_RESPONSE,
	JOIN_GAME,
	START_GAME,
}

export type AllGamesRequest = {
	opcode: GolfPacketOpcode.ALL_GAMES_REQUEST;
};

export type AllGamesResponse = {
	opcode: GolfPacketOpcode.ALL_GAMES_RESPONSE;
	games: string[];
};

export type JoinRoom = {
	opcode: GolfPacketOpcode.JOIN_GAME;
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

export type GolfPackets = PrepShot | ShootBall | AllGamesRequest | AllGamesResponse | JoinRoom | StartGame;

export const useGolfNetworking = (system: System | Engine, callbacks?: NetworkingCallbacks) =>
	useNetworking<GolfPacketOpcode, GolfPackets>(system, callbacks);
