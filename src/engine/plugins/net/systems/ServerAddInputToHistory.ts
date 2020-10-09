import { Entity, EntitySnapshot } from '@ecs/core/Entity';
import { useQueries } from '@ecs/core/helpers';
import { IterativeSystem } from '@ecs/core/IterativeSystem';
import { InputHistory } from '@ecs/plugins/input/components/InputHistory';
import { PacketOpcode, PlayerInput, PlayerCustomInput } from '@ecs/plugins/net/components/Packet';
import { ServerPingState } from '@ecs/plugins/net/components/ServerPingState';
import Session from '@ecs/plugins/net/components/Session';
import { all, makeQuery } from '@ecs/core/Query';
import { useBaseNetworking } from '../helpers/useNetworking';

export class ServerAddInputToHistory extends IterativeSystem {
	protected queries = useQueries(this, {
		serverPing: all(ServerPingState)
	});

	protected networking = useBaseNetworking(this);

	constructor() {
		super(makeQuery(all(Session, InputHistory)));

		this.networking.on(PacketOpcode.PLAYER_INPUT, this.handleInputPacket.bind(this));
	}

	protected handleInputPacket({ tick, input }: PlayerInput, entity: Entity) {
		const { serverTick } = this.queries.serverPing.first.get(ServerPingState);
		const inputHistory = entity.get(InputHistory);

		const clientAhead = tick - serverTick;

		// console.log(clientAhead + " Client: " + tick + " Server: " + serverTick);

		if (clientAhead < 1) {
			console.log(`Client sending old input packets ${clientAhead}`);
		}

		if (!inputHistory) {
			console.log('No player input history');
		} else {
			inputHistory.inputs[tick] = input;
		}
	}
}

export class ServerCustomAddInputToHistory extends IterativeSystem {
	protected queries = useQueries(this, {
		serverPing: all(ServerPingState)
	});

	protected networking = useBaseNetworking(this);

	constructor() {
		super(makeQuery(all(Session, InputHistory)));

		this.networking.on(PacketOpcode.PLAYER_CUSTOM_INPUT, this.handleInputPacket.bind(this));
	}

	protected handleInputPacket({ tick, input }: PlayerCustomInput, entity: Entity) {
		const { serverTick } = this.queries.serverPing.first.get(ServerPingState);
		const inputHistory = entity.get(InputHistory);

		const clientAhead = tick - serverTick;

		// console.log(clientAhead + " Client: " + tick + " Server: " + serverTick);

		if (clientAhead < 1) {
			console.log(`Client sending old input packets ${clientAhead}`);
		}

		if (!inputHistory) {
			console.log('No player input history');
		} else {
			inputHistory.inputs[tick] = input;
		}
	}
}
