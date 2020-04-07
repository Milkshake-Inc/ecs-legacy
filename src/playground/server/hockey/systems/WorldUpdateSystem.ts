import { makeQuery, all } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Session from '@ecs/plugins/net/components/Session';
import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import { PacketOpcode } from '@ecs/plugins/net/components/Packet';
import { Player } from '../components/Player';

export default class WorldUpdateSystem extends IterativeSystem {
	private connections: ServerConnectionSystem;

	constructor(connections: ServerConnectionSystem) {
		super(makeQuery(all(Session, Player)));
		this.connections = connections;
	}

	updateFixed(dt: number) {
		this.connections.broadcast({
			opcode: PacketOpcode.WORLD,
			entities: Array.from(this.query.entities)
		});
	}
}
