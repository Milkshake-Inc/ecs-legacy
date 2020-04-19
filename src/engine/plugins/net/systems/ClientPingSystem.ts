import { PacketOpcode, Packet } from '../components/Packet';
import { makeQuery, any, all } from '@ecs/utils/QueryHelper';
import { EntitySnapshot, Entity } from '@ecs/ecs/Entity';
import Session from '../components/Session';
import { StatefulIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import { ClientPingState } from '../components/ClientPingState';

export const ClientPingStateQuery = {
	pingState: makeQuery(all(ClientPingState))
};

export default class ClientPingSystem extends StatefulIterativeSystem<ClientPingState> {
	constructor() {
		super(makeQuery(any(Session)), new ClientPingState());
	}

	public updateFixed(deltaTime: number) {
		if (this.state.tickInitialized) {
			this.state.serverTime += deltaTime;
			this.state.serverTick = Math.floor(this.state.serverTime / this.state.serverTickRateMs);
		}

		super.updateFixed(deltaTime);
	}

	protected entityAdded = (snapshot: EntitySnapshot) => {
		const entity = snapshot.entity;
		const session = entity.get(Session);

		// TODO Unbind this!
		session.socket.handleImmediate(packet => {
			this.handlePacket(entity, session, packet);
		});
	};

	protected handlePacket(entity: Entity, session: Session, packet: Packet) {
		switch (packet.opcode) {
			case PacketOpcode.SERVER_SYNC_PING: {
				session.socket.sendImmediate({
					opcode: PacketOpcode.CLIENT_SYNC_PONG,
					clientTime: performance.now(),
					serverTime: packet.serverTime
				});
				break;
			}
			case PacketOpcode.SERVER_SYNC_RESULT: {
				this.state.rtt = performance.now() - packet.clientTime;

				this.state.serverTickRateMs = packet.serverTickRateMs;

				let newServerTime = packet.serverTime + this.state.rtt / 2;
				// We push the client ahead of time HRTT + 1 Tick (Hacked to 2)
				newServerTime += this.state.rtt / 2 + this.state.serverTickRateMs * 2;

				console.log(
					`Client estimated RTT: ${this.state.rtt} ServerTime: ${packet.serverTime} Estimated ServerTime: ${this.state.serverTime}`
				);

				if (this.state.serverTime) {
					console.log(`⏱ Server time diff ${this.state.serverTime - newServerTime}`);
				} else {
					console.log(`⏱ Server time set ${newServerTime}`);
				}

				if (!this.state.tickInitialized) {
					this.state.serverTime = newServerTime;
				}

				this.state.tickInitialized = true;
			}
		}
	}
}
