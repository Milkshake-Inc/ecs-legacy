import Input from '@ecs/plugins/input/components/Input';

export enum PacketOpcode {
	SERVER_SYNC_PING,
	CLIENT_SYNC_PONG,
	SERVER_SYNC_RESULT,
	WORLD,
	PLAYER_INPUT,
	PLAYER_CUSTOM_INPUT,
	SESSION_UPDATE
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

export type WorldSnapshot<T = {}> = {
	opcode: PacketOpcode.WORLD;
	tick: number;
	snapshot: T;
};

export type PlayerInput = {
	opcode: PacketOpcode.PLAYER_INPUT;
	tick: number;
	input: Input<any>;
};

export type PlayerCustomInput<T = {}> = {
	opcode: PacketOpcode.PLAYER_CUSTOM_INPUT;
	tick: number;
	input: T;
};

export type SessionUpdate = {
	opcode: PacketOpcode.SESSION_UPDATE;
	token: string;
	id: string;
};

export type Packet = ServerSyncPing | ClientSyncPong | ServerSyncResult | WorldSnapshot | PlayerInput | PlayerCustomInput | SessionUpdate;
