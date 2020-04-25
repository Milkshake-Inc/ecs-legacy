import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { InputHistory } from '@ecs/plugins/input/components/InputHistory';
import { PacketOpcode, PlayerInput } from '@ecs/plugins/net/components/Packet';
import { ServerPingState } from '@ecs/plugins/net/components/ServerPingState';
import Session from '@ecs/plugins/net/components/Session';
import { all, makeQuery } from '@ecs/utils/QueryHelper';

export class ServerAddInputToHistory extends IterativeSystem {
	protected queries = useQueries(this, {
		serverPing: all(ServerPingState)
	});

	constructor() {
		super(makeQuery(all(Session, InputHistory)));
	}

	protected entityAdded = (snapshot: EntitySnapshot) => {
		const entity = snapshot.entity;
		const session = entity.get(Session);

		session.socket.handleImmediate(packet => {
			if (packet.opcode == PacketOpcode.PLAYER_INPUT) {
				this.handleInputPacket(entity, packet);
			}
		});
	};

	protected handleInputPacket(entity: Entity, { tick, input }: PlayerInput) {
		const { serverTick } = this.queries.serverPing.first.get(ServerPingState);
		const inputHistory = entity.get(InputHistory);

		const clientAhead = tick - serverTick;

		// console.log(clientAhead + " Client: " + tick + " Server: " + serverTick);

		if (clientAhead < 1) {
			console.log('Client sending old input packets ' + clientAhead);
		}

		if (!inputHistory) {
			console.log('No player input history');
		} else {
			inputHistory.inputs[tick] = input;
		}
	}
}
