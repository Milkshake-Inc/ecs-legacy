import { Entity, EntitySnapshot } from '@ecs/core/Entity';
import { useState } from '@ecs/core/helpers';
import { IterativeSystem } from '@ecs/core/IterativeSystem';
import { any, makeQuery } from '@ecs/core/Query';
import { performance } from 'perf_hooks';
import { ClientSyncPong, PacketOpcode } from '../components/Packet';
import { ServerPingState } from '../components/ServerPingState';
import Session from '../components/Session';
import { useBaseNetworking } from '../helpers/useNetworking';

const MAX_PING_DELAY = 2000;
const PING_INTERVAL = 3000;

export default class ServerPingSystem extends IterativeSystem {
	protected state = useState(this, new ServerPingState());
	protected networking = useBaseNetworking(this);

	constructor(tickRate: number, pingInterval = PING_INTERVAL) {
		super(makeQuery(any(Session)));

		this.state.serverTickRate = tickRate;
		this.state.serverPingInterval = pingInterval;

		this.networking.on(PacketOpcode.CLIENT_SYNC_PONG, this.handlePong.bind(this));
	}

	public handlePong(packet: ClientSyncPong, entity: Entity): void {
		const session = entity.get(Session);

		session.lastPongResponse = performance.now();
		session.rtt = performance.now() - packet.serverTime;

		this.networking.sendTo(entity, {
			opcode: PacketOpcode.SERVER_SYNC_RESULT,
			clientTime: packet.clientTime,
			serverTime: this.state.serverTime,
			serverTick: this.state.serverTick,
			serverTickRateMs: this.state.serverTickRateMs
		});
	}

	public updateFixed(dt: number): void {
		this.state.serverTime += dt;
		this.state.timeSinceLastPing += dt;
		this.state.serverTick = Math.floor(this.state.serverTime / this.state.serverTickRateMs);

		if (this.state.timeSinceLastPing >= this.state.serverPingInterval) {
			this.state.timeSinceLastPing = 0;

			this.networking.send({
				opcode: PacketOpcode.SERVER_SYNC_PING,
				serverTime: performance.now()
			});
		}

		super.updateFixed(dt);
	}

	protected updateEntityFixed(entity: Entity, dt: number): void {
		// Disconnect players that don't respond to ping
		const session = entity.get(Session);
		if (
			session.lastPongResponse != -1 &&
			performance.now() - session.lastPongResponse > this.state.serverPingInterval + MAX_PING_DELAY
		) {
			console.log(`Disconnecting player ${performance.now() - session.lastPongResponse}`);
			console.log(this.state.serverPingInterval);

			this.networking.disconnect(entity);
		}
	}

	protected entityAdded = (entity: EntitySnapshot): void => {
		this.networking.sendTo(entity.entity, {
			opcode: PacketOpcode.SERVER_SYNC_PING,
			serverTime: performance.now()
		});
	};
}
