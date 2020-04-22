import { Entity } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers/StatefulSystems';
import Input from '@ecs/plugins/input/components/Input';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { ClientPingState } from '../components/ClientPingState';
import { PacketOpcode } from '../components/Packet';
import Session from '../components/Session';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';

export default class ClientInputSenderSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		pingState: all(ClientPingState)
	});

	constructor() {
		super(makeQuery(all(Session, Input)));
	}

	protected updateEntityFixed(entity: Entity, deltaTime: number) {
		const session = entity.get(Session);
		const input = entity.get(Input);
		const { serverTick } = this.queries.pingState.first.get(ClientPingState);

		session.socket.sendImmediate({
			opcode: PacketOpcode.PLAYER_INPUT,
			input: input,
			tick: serverTick
		});
	}
}
