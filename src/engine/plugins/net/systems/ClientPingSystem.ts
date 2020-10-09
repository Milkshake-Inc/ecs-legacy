import { Entity, EntitySnapshot } from '@ecs/core/Entity';
import { IterativeSystem } from '@ecs/core/IterativeSystem';
import { any, makeQuery } from '@ecs/core/Query';
import { ClientPingState } from '../components/ClientPingState';
import { Packet, PacketOpcode, ServerSyncPing, ServerSyncResult } from '../components/Packet';
import Session from '../components/Session';
import { useState } from '@ecs/core/helpers';
import { useBaseNetworking } from '../helpers/useNetworking';

export default class ClientPingSystem extends IterativeSystem {
	protected state = useState(this, new ClientPingState());
	protected networking = useBaseNetworking(this);

	constructor() {
		super(makeQuery(any(Session)));

		this.state.serverTime = 0;
		this.state.serverTick = 0;

		this.networking.on(PacketOpcode.SERVER_SYNC_PING, this.handlePing.bind(this));
		this.networking.on(PacketOpcode.SERVER_SYNC_RESULT, this.handleResult.bind(this));
	}

	public updateFixed(dt: number) {
		if (this.state.tickInitialized) {
			this.state.serverTime += dt;
			this.state.serverTick = Math.floor(this.state.serverTime / this.state.serverTickRateMs);
		}

		super.updateFixed(dt);
	}

	protected handlePing(packet: ServerSyncPing) {
		this.networking.send({
			opcode: PacketOpcode.CLIENT_SYNC_PONG,
			clientTime: performance.now(),
			serverTime: packet.serverTime
		});
	}

	protected handleResult(packet: ServerSyncResult) {
		this.state.rtt = performance.now() - packet.clientTime;

		this.state.serverTickRateMs = packet.serverTickRateMs;

		let newServerTime = packet.serverTime + this.state.rtt / 2;
		// We push the client ahead of time HRTT + 1 Tick (Hacked to 2)
		newServerTime += this.state.rtt / 2 + this.state.serverTickRateMs * 2;

		// console.log(
		// 	`Client estimated RTT: ${this.state.rtt} ServerTime: ${packet.serverTime} Estimated ServerTime: ${this.state.serverTime}`
		// );

		// if (this.state.serverTime) {
		// 	console.log(`⏱ Server time diff ${this.state.serverTime - newServerTime}`);
		// } else {
		// 	console.log(`⏱ Server time set ${newServerTime}`);
		// }

		if (!this.state.tickInitialized) {
			this.state.serverTime = newServerTime;
		}

		this.state.tickInitialized = true;
	}
}
