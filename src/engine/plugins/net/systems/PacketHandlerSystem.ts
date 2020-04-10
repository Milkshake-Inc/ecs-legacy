import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Session from '../components/Session';
import { any, makeQuery } from '@ecs/utils/QueryHelper';
import { Entity } from '@ecs/ecs/Entity';
import { PacketOpcode, Packet, WorldSnapshot, PlayerInput } from '../components/Packet';

export class PacketHandlerSystem<T extends Packet> extends IterativeSystem {
	protected opcode: PacketOpcode;
	protected handler: (entity: Entity, packet: T) => void;

	constructor(opcode: PacketOpcode, handler: (entity: Entity, packet: T) => void) {
		super(makeQuery(any(Session)));

		this.opcode = opcode;
		this.handler = handler;
	}

	updateEntity(entity: Entity) {
		const session = entity.get(Session);
		const packets = session.socket.handle<T>(this.opcode);

		packets.forEach(p => this.handler(entity, p));
	}
}

export class WorldSnapshotHandlerSystem<T extends {}> extends PacketHandlerSystem<WorldSnapshot<T>> {
	constructor(handler: (entity: Entity, packet: WorldSnapshot<T>) => void) {
		super(PacketOpcode.WORLD, handler);
	}
}

export class PlayerInputHandlerSystem extends PacketHandlerSystem<PlayerInput> {
	constructor(handler: (entity: Entity, packet: PlayerInput) => void) {
		super(PacketOpcode.WORLD, handler);
	}
}
