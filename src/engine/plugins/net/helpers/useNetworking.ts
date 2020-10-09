import { Engine } from '@ecs/core/Engine';
import { Entity } from '@ecs/core/Entity';
import { System } from '@ecs/core/System';
import { Packet, PacketOpcode } from '../components/Packet';
import { useSimpleEvents } from '@ecs/core/helpers';
import { NetEvents } from '@ecs/plugins/net/components/NetEvents';

export type NetworkingCallbacks = {
	connect?: (entity: Entity) => void;
	disconnect?: (entity: Entity) => void;
};

export const useBaseNetworking = (system: System, callbacks?: NetworkingCallbacks) =>
	useNetworking<PacketOpcode, Packet>(system, callbacks);

export const useNetworking = <TOpcode, TPackets extends { opcode: TOpcode }>(system: System | Engine, callbacks?: NetworkingCallbacks) => {
	type PacketsOfType<T extends TOpcode> = Extract<TPackets, { opcode: T }>;

	const events = useSimpleEvents();

	if (callbacks?.connect) {
		events.on(NetEvents.OnConnected, callbacks.connect);
	}

	if (callbacks?.disconnect) {
		events.on(NetEvents.OnDisconnected, callbacks.disconnect);
	}

	return {
		on: <T extends TOpcode>(opcode: T, onPacket: (packet: PacketsOfType<T>, entity?: Entity) => void) => {
			const handler = (e: Entity, packet: TPackets) => {
				if (packet.opcode === opcode) {
					onPacket(packet as PacketsOfType<T>, e);
				}
			};
			events.on(NetEvents.OnPacket, handler);
		},
		once: <T extends TOpcode>(opcode: T, onPacket: (packet: PacketsOfType<T>, entity?: Entity) => void) => {
			const handler = (entity: Entity, packet: TPackets) => {
				if (packet.opcode === opcode) {
					onPacket(packet as PacketsOfType<T>, entity);
				}
			};
			events.once(NetEvents.OnPacket, handler);
		},
		send: (packet: TPackets, reliable = false) => {
			events.emit(NetEvents.Send, packet, reliable);
		},
		sendTo: (entity: Entity, packet: TPackets, reliable = false) => {
			events.emit(NetEvents.SendTo, entity, packet, reliable);
		},
		sendExcept: (exceptEntity: Entity, packet: TPackets, reliable = false) => {
			events.emit(NetEvents.SendExcept, exceptEntity, packet, reliable);
		},
		disconnect: (entity: Entity) => {
			events.emit(NetEvents.Disconnect, entity);
		}
	};
};
