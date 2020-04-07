import { Entity } from '@ecs/ecs/Entity';

export enum PacketOpcode {
	SERVER_SYNC_PING,
	CLIENT_SYNC_PONG,
	SERVER_SYNC_RESULT,
	WORLD
}

export type ServerSyncPing = {
	opcode: PacketOpcode.SERVER_SYNC_PING;
	serverTime: number;
};

export type ClientSyncPong = {
	opcode: PacketOpcode.CLIENT_SYNC_PONG;
	serverTime: number;
	clientTime: number;
};

export type ServerSyncResult = {
	opcode: PacketOpcode.SERVER_SYNC_RESULT;
	clientTime: number;

	serverTime: number;
	serverTick: number;
	serverTickRateMs: number;
};

export type WorldUpdate = {
	opcode: PacketOpcode.WORLD;
	entities: Entity[];
};

export type Packet = ServerSyncPing | ClientSyncPong | ServerSyncResult | WorldUpdate;
