import { all, Class, System } from 'tick-knock';
import { useQueries } from '@ecs/core/helpers';
import Input from '@ecs/plugins/input/components/Input';
import { ClientPingState } from '../components/ClientPingState';
import { PacketOpcode } from '../components/Packet';
import Session from '../components/Session';
import { useBaseNetworking } from '../helpers/useNetworking';

export default class ClientInputSenderSystem extends System {
	protected queries = useQueries(this, {
		pingState: all(ClientPingState),
		inputSessions: all(Session, Input)
	});

	protected networking = useBaseNetworking(this);

	update(dt: number) {
		this.queries.inputSessions.forEach(entity => {
			const input = entity.get(Input);
			const { serverTick } = this.queries.pingState.first.get(ClientPingState);

			this.networking.send({
				opcode: PacketOpcode.PLAYER_INPUT,
				input,
				tick: serverTick
			});
		});
	}
}

// Make this fallback to Input if no CustomInput sent?
export class ClientCustomInputSenderSystem<T = Input<any>> extends System {
	protected queries = useQueries(this, {
		pingState: all(ClientPingState),
		inputSessions: all(Session, Input)
	});

	protected networking = useBaseNetworking(this);

	private inputClass: Class<T>;

	constructor(inputClass: Class<T>) {
		super();
		this.inputClass = inputClass;
	}

	update(dt: number) {
		this.queries.inputSessions.forEach(entity => {
			const input = entity.get(this.inputClass);
			const { serverTick } = this.queries.pingState.first.get(ClientPingState);

			this.networking.send({
				opcode: PacketOpcode.PLAYER_CUSTOM_INPUT,
				input,
				tick: serverTick
			});
		});
	}
}
