import { Entity } from '@ecs/core/Entity';
import { useQueries } from '@ecs/core/helpers';
import Input from '@ecs/plugins/input/components/Input';
import { all, makeQuery } from '@ecs/core/Query';
import { ClientPingState } from '../components/ClientPingState';
import { PacketOpcode } from '../components/Packet';
import Session from '../components/Session';
import { IterativeSystem } from '@ecs/core/IterativeSystem';
import { Class } from '@ecs/core/Class';
import { useBaseNetworking } from '../helpers/useNetworking';

export default class ClientInputSenderSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		pingState: all(ClientPingState)
	});

	protected networking = useBaseNetworking(this);

	constructor() {
		super(makeQuery(all(Session, Input)));
	}

	protected updateEntityFixed(entity: Entity, deltaTime: number) {
		const input = entity.get(Input);
		const { serverTick } = this.queries.pingState.first.get(ClientPingState);

		this.networking.send({
			opcode: PacketOpcode.PLAYER_INPUT,
			input,
			tick: serverTick
		});
	}
}

// Make this fallback to Input if no CustomInput sent?
export class ClientCustomInputSenderSystem<T = Input<any>> extends IterativeSystem {
	protected queries = useQueries(this, {
		pingState: all(ClientPingState)
	});

	protected networking = useBaseNetworking(this);

	private inputClass: Class<T>;

	constructor(inputClass: Class<T>) {
		super(makeQuery(all(Session, inputClass)));

		this.inputClass = inputClass;
	}

	protected updateEntityFixed(entity: Entity, deltaTime: number) {
		const input = entity.get(this.inputClass);
		const { serverTick } = this.queries.pingState.first.get(ClientPingState);

		this.networking.send({
			opcode: PacketOpcode.PLAYER_CUSTOM_INPUT,
			input,
			tick: serverTick
		});
	}
}
