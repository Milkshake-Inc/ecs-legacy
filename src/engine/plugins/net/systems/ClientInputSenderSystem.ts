import { makeQuery, all } from '@ecs/utils/QueryHelper';
import Input from '@ecs/plugins/input/components/Input';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Session from '../components/Session';
import { PacketOpcode } from '../components/Packet';
import { Entity } from '@ecs/ecs/Entity';

export default class ClientInputSenderSystem extends IterativeSystem {
	constructor() {
		super(makeQuery(all(Session, Input)));
	}

	protected updateEntityFixed(entity: Entity, deltaTime: number) {
		const session = entity.get(Session);
		const input = entity.get(Input);

		session.socket.send({
			opcode: PacketOpcode.PLAYER_INPUT,
			input: input,
			tick: session.serverTick
		});
	}
}
