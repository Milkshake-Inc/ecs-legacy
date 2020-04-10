import Input from '@ecs/plugins/input/components/Input';

export enum PacketOpcode {
	SERVER_SYNC_PING,
	CLIENT_SYNC_PONG,
	SERVER_SYNC_RESULT,
	WORLD,
	PLAYER_INPUT
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
	snapshot: T;
};

export type PlayerInput = {
	opcode: PacketOpcode.PLAYER_INPUT;
	tick: number;
	input: Input;
};

export type Packet = ServerSyncPing | ClientSyncPong | ServerSyncResult | WorldSnapshot | PlayerInput;
