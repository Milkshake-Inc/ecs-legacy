import { Engine } from '@ecs/core/Engine';
import { Entity } from '@ecs/core/Entity';
import { System } from '@ecs/core/System';
import { all, makeQuery } from '@ecs/core/Query';
import Session from '../components/Session';
import { Packet, PacketOpcode } from '../components/Packet';

export type NetworkingCallbacks = {
	connect?: (entity: Entity) => void;
	disconnect?: (entity: Entity) => void;
};

export const useBaseNetworking = (system: System, callbacks?: NetworkingCallbacks) =>
	useNetworking<PacketOpcode, Packet>(system, callbacks);

export const useNetworking = <TOpcode, TPackets extends { opcode: TOpcode }>(system: System | Engine, callbacks?: NetworkingCallbacks) => {
	const sessionQuery = makeQuery(all(Session));

	const packetHandlers: ((packet: TPackets, entity: Entity) => void)[] = [];

	const onAddedCallback = (engine: Engine) => {
		engine.addQuery(sessionQuery);
	};

	const handlePacket = (entity: Entity, packet: TPackets) => {
		packetHandlers.forEach(packetHandle => packetHandle(packet, entity));
	};

	sessionQuery.onEntityAdded.connect(snapshot => {
		if (callbacks?.connect) {
			callbacks.connect(snapshot.entity);
		}

		// Bind to packets - NOT update synced.
		const entity = snapshot.entity;
		const session = entity.get(Session);
		session.socket.handleImmediate(packet => handlePacket(entity, packet as any));
	});

	sessionQuery.onEntityRemoved.connect(snapshot => {
		if (callbacks?.disconnect) {
			callbacks.disconnect(snapshot.entity);
		}
	});

	if (system instanceof System) {
		system.signalOnAddedToEngine.connect(onAddedCallback);
		system.signalOnRemovedFromEngine.disconnect(onAddedCallback);
	} else {
		onAddedCallback(system);
	}

	type PacketsOfType<T extends TOpcode> = Extract<TPackets, { opcode: T }>;

	return {
		on: <T extends TOpcode>(opcode: T, onPacket: (packet: PacketsOfType<T>, entity?: Entity) => void) => {
			const handler = (packet: TPackets, entity: Entity) => {
				if (packet.opcode === opcode) {
					onPacket(packet as PacketsOfType<T>, entity);
				}
			};
			packetHandlers.push(handler);
		},
		send: (packet: TPackets, reliable = false) => {
			sessionQuery.forEach(entity => {
				entity.get(Session).socket.send(packet, reliable);
			});
		},
		sendTo: (entity: Entity, packet: TPackets, reliable = false) => {
			entity.get(Session).socket.send(packet, reliable);
		},
		sendExcept: (exceptEntity: Entity, packet: TPackets, reliable = false) => {
			sessionQuery.forEach(entity => {
				if (entity != exceptEntity) {
					entity.get(Session).socket.send(packet);
				}
			});
		}
	};
};
