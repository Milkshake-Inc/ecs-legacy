import { any, Entity, System } from 'tick-knock';
import { useQueries, useState } from '@ecs/core/helpers';
import { performance } from 'perf_hooks';
import { ClientSyncPong, PacketOpcode } from '../components/Packet';
import { ServerPingState } from '../components/ServerPingState';
import Session from '../components/Session';
import { useBaseNetworking } from '../helpers/useNetworking';

const MAX_PING_DELAY = 5000;
const PING_INTERVAL = 3000;

export default class ServerPingSystem extends System {
	protected state = useState(this, new ServerPingState());
	protected networking = useBaseNetworking(this);
	protected queries = useQueries(this, {
		sessions: any(Session)
	});

	constructor(tickRate: number, pingInterval = PING_INTERVAL) {
		super();

		this.state.serverTickRate = tickRate;
		this.state.serverPingInterval = pingInterval;

		this.networking.on(PacketOpcode.CLIENT_SYNC_PONG, this.handlePong.bind(this));

		this.queries.sessions.onEntityAdded.connect(entity => {
			this.networking.sendTo(entity.entity, {
				opcode: PacketOpcode.SERVER_SYNC_PING,
				serverTime: performance.now()
			});
		});
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

		this.queries.sessions.forEach(entity => {
			// Disconnect players that don't respond to ping
			const session = entity.get(Session);
			if (
				session.lastPongResponse != -1 &&
				performance.now() - session.lastPongResponse > this.state.serverPingInterval + MAX_PING_DELAY
			) {
				console.log(`Ping too high. Disconnecting player ${performance.now() - session.lastPongResponse}`);
				console.log(this.state.serverPingInterval);

				this.networking.disconnect(entity);
			}
		});

		super.updateFixed(dt);
	}
}
