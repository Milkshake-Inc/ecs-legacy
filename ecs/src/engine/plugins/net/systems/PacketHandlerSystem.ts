import { IterativeSystem } from '@ecs/core/IterativeSystem';
import Session from '../components/Session';
import { any, makeQuery } from '@ecs/core/Query';
import { Entity, EntitySnapshot } from '@ecs/core/Entity';
import { PacketOpcode, Packet, WorldSnapshot, PlayerInput } from '../components/Packet';

export class PacketHandlerSystem<T extends Packet> extends IterativeSystem {
	protected opcode: PacketOpcode;
	protected handler: (entity: Entity, packet: T) => void;

	constructor(opcode: PacketOpcode, handler: (entity: Entity, packet: T) => void) {
		super(makeQuery(any(Session)));

		this.opcode = opcode;
		this.handler = handler;
	}

	protected entityAdded = (snapshot: EntitySnapshot) => {
		const entity = snapshot.entity;
		const session = entity.get(Session);

		session.socket.handleImmediate(packet => {
			if (packet.opcode == this.opcode) {
				this.handler(entity, packet as T);
			}
		});
	};

	// TODO: Need to remove handleImmediate
}

export class WorldSnapshotHandlerSystem<T extends {}> extends PacketHandlerSystem<WorldSnapshot<T>> {
	constructor(handler: (entity: Entity, packet: WorldSnapshot<T>) => void) {
		super(PacketOpcode.WORLD, handler);
	}
}

export class PlayerInputHandlerSystem extends PacketHandlerSystem<PlayerInput> {
	constructor(handler: (entity: Entity, packet: PlayerInput) => void) {
		super(PacketOpcode.PLAYER_INPUT, handler);
	}
}
