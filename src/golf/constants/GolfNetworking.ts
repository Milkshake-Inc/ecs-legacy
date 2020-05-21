import { System } from "@ecs/ecs/System";
import { NetworkingCallbacks, useNetworking } from "@ecs/plugins/net/helpers/useNetworking";

export enum GolfPacketOpcode {
	SEND_MAP = 6,
}

export type ServerSendMap = {
	opcode: GolfPacketOpcode.SEND_MAP;
	name: string;
	data: { modelName: string; transform: any }[];
};

export type GolfPackets = ServerSendMap;

export const useGolfNetworking = (system: System, callbacks?: NetworkingCallbacks) => useNetworking<GolfPacketOpcode, GolfPackets>(system, callbacks);