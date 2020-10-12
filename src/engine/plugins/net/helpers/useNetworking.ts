import { Engine } from '@ecs/core/Engine';
import { Entity } from '@ecs/core/Entity';
import { System } from '@ecs/core/System';
import { Packet, PacketOpcode } from '../components/Packet';
import { useQueries, useSimpleEvents } from '@ecs/core/helpers';
import { NetEvents } from '@ecs/plugins/net/components/NetEvents';
import Session from '../components/Session';
import { all, makeQuery } from '@ecs/core/Query';

export type NetworkingCallbacks = {
	connect?: (entity: Entity) => void;
	disconnect?: (entity: Entity) => void;
};

export const useBaseNetworking = (system: System, callbacks?: NetworkingCallbacks) =>
	useNetworking<PacketOpcode, Packet>(system, callbacks);

const useEngine = (systemOrEngine: System | Engine) => {
	let engineInstance: Engine = undefined;

	if (systemOrEngine instanceof System) {
		systemOrEngine.signalOnAddedToEngine.connect(engine => {
			engineInstance = engine;
		});
	} else {
		engineInstance = systemOrEngine;
	}

	return () => engineInstance;
};

export const useNetworking = <TOpcode, TPackets extends { opcode: TOpcode }>(system: System | Engine, callbacks?: NetworkingCallbacks) => {
	type PacketsOfType<T extends TOpcode> = Extract<TPackets, { opcode: T }>;

	const events = useSimpleEvents();

	if (callbacks?.connect) {
		events.on(NetEvents.OnConnected, callbacks.connect);
	}

	if (callbacks?.disconnect) {
		events.on(NetEvents.OnDisconnected, callbacks.disconnect);
	}

	const queries = useQueries(system, {
		sessions: all(Session)
	});

	const hasEntity = (entity: Entity) => {
		return queries.sessions.includes(entity);
	};

	return {
		on: <T extends TOpcode>(opcode: T, onPacket: (packet: PacketsOfType<T>, entity?: Entity) => void) => {
			const handler = (entity: Entity, packet: TPackets) => {
				if (packet.opcode === opcode) {
					if (!entity || hasEntity(entity)) {
						onPacket(packet as PacketsOfType<T>, entity);
					}
				}
			};
			events.on(NetEvents.OnPacket, handler);
		},
		once: <T extends TOpcode>(opcode: T, onPacket: (packet: PacketsOfType<T>, entity?: Entity) => void) => {
			const handler = (entity: Entity, packet: TPackets) => {
				if (packet.opcode === opcode) {
					if (!entity || hasEntity(entity)) {
						onPacket(packet as PacketsOfType<T>, entity);
					}
				}
			};
			events.once(NetEvents.OnPacket, handler);
		},
		broadcast: (packet: TPackets, reliable = false) => {
			events.emit(NetEvents.Send, packet, reliable);
		},
		send: (packet: TPackets, reliable = false) => {
			queries.sessions.forEach(entity => events.emit(NetEvents.SendTo, entity, packet, reliable));
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
