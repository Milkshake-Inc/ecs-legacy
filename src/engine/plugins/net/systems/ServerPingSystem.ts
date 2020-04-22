import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { StatefulIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { performance } from 'perf_hooks';
import { PacketOpcode } from '../components/Packet';
import { ServerPingState } from '../components/ServerPingState';
import Session from '../components/Session';
import { ServerConnectionQuery, ServerConnectionState } from './ServerConnectionSystem';

export const ServerPingStateQuery = {
	serverPing: makeQuery(all(ServerPingState))
};

export default class ServerPingSystem extends StatefulIterativeSystem<ServerPingState, typeof ServerConnectionQuery> {
	constructor(tickRate: number, pingInterval = 3000) {
		super(makeQuery(any(Session)), new ServerPingState(tickRate, pingInterval), ServerConnectionQuery);
	}

	public updateFixed(deltaTime: number) {
		this.state.serverTime += deltaTime;
		this.state.timeSinceLastPing += deltaTime;
		this.state.serverTick = Math.floor(this.state.serverTime / this.state.serverTickRateMs);

		if (this.state.timeSinceLastPing >= this.state.serverPingInterval) {
			this.state.timeSinceLastPing = 0;

			const { broadcast } = this.queries.serverConnection.first.get(ServerConnectionState);

			broadcast(
				{
					opcode: PacketOpcode.SERVER_SYNC_PING,
					serverTime: performance.now()
				},
				true
			);
		}

		super.updateFixed(deltaTime);
	}

	protected updateEntityFixed(entity: Entity, dt: number): void {
		// Disconnect players that don't respond to ping
		const session = entity.get(Session);
		if (session.lastPongResponse != -1 && performance.now() - session.lastPongResponse > this.state.serverPingInterval + 1000) {
			console.log('Disconnecting player ' + (performance.now() - session.lastPongResponse));
			console.log(this.state.serverPingInterval);
			// We should send a disconnect packet to player...
			const { disconnect } = this.queries.serverConnection.first.get(ServerConnectionState);
			disconnect(entity);
		}
	}

	protected entityAdded = (entity: EntitySnapshot) => {
		const session = entity.get(Session);
		session.socket.sendImmediate({
			opcode: PacketOpcode.SERVER_SYNC_PING,
			serverTime: performance.now()
		});

		session.socket.handleImmediate(packet => {
			switch (packet.opcode) {
				case PacketOpcode.CLIENT_SYNC_PONG: {
					session.lastPongResponse = performance.now();
					const rtt = performance.now() - packet.serverTime;
					console.log(`⏱ Server estimated RTT: ${rtt}`);
					session.socket.sendImmediate({
						opcode: PacketOpcode.SERVER_SYNC_RESULT,
						clientTime: packet.clientTime,
						serverTime: this.state.serverTime,
						serverTick: this.state.serverTick,
						serverTickRateMs: this.state.serverTickRateMs
					});
				}
			}
		});
	};
}
