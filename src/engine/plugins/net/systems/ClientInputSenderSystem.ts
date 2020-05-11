import { Entity } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers';
import Input from '@ecs/plugins/input/components/Input';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { ClientPingState } from '../components/ClientPingState';
import { PacketOpcode } from '../components/Packet';
import Session from '../components/Session';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Class } from '@ecs/utils/Class';

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


// Make this fallback to Input if no CustomInput sent?
export class ClientCustomInputSenderSystem<T = Input> extends IterativeSystem {

	protected queries = useQueries(this, {
		pingState: all(ClientPingState)
	});

	private inputClass: Class<T>;

	constructor(inputClass: Class<T>) {
		super(makeQuery(all(Session, inputClass)));

		this.inputClass = inputClass;
	}

	protected updateEntityFixed(entity: Entity, deltaTime: number) {
		const session = entity.get(Session);
		const input = entity.get(this.inputClass);
		const { serverTick } = this.queries.pingState.first.get(ClientPingState);

		session.socket.sendImmediate({
			opcode: PacketOpcode.PLAYER_CUSTOM_INPUT,
			input: input,
			tick: serverTick
		});
	}
}
