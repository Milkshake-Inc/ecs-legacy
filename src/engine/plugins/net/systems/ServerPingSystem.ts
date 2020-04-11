import { performance } from 'perf_hooks';
import { PacketOpcode } from '../components/Packet';
import { makeQuery, any } from '@ecs/utils/QueryHelper';
import { EntitySnapshot, Entity } from '@ecs/ecs/Entity';
import Session from '../components/Session';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import ServerConnectionSystem from './ServerConnectionSystem';
import { ServerPingState } from '../components/ServerPingState';
import { Engine } from '@ecs/ecs/Engine';

export default class ServerPingSystem extends IterativeSystem {
	private connections: ServerConnectionSystem;

	private state: ServerPingState;

	constructor(tickRate: number, connections: ServerConnectionSystem, pingInterval = 5000) {
		super(makeQuery(any(Session)));

		// Maybe this constructor should force required vars
		this.state = new ServerPingState();
		this.state.serverTickRateMs = 1000 / tickRate;
		this.state.serverPingInterval = pingInterval;

		this.connections = connections;
	}

	public onAddedToEngine(engine: Engine) {
		engine.addEntity(new Entity().add(this.state));
	}

	public update(deltaTime: number) {
		this.state.serverTime += deltaTime;
		this.state.timeSinceLastPing += deltaTime;
		this.state.serverTick = Math.floor(this.state.serverTime / this.state.serverTickRateMs);

		if (this.state.timeSinceLastPing >= this.state.serverPingInterval) {
			this.state.timeSinceLastPing = 0;

			this.connections.broadcast(
				{
					opcode: PacketOpcode.SERVER_SYNC_PING,
					serverTime: performance.now()
				},
				true
			);

			console.log(`⏱ Sending ping`);
		}

		super.update(deltaTime);
	}

	protected updateEntity(entity: Entity, dt: number): void {
		const session = entity.get(Session);
		session.serverTick = this.state.serverTick;
		session.serverTime = this.state.serverTime;

		// Disconnect players that don't respond to ping
		if (session.lastPongResponse != -1 && performance.now() - session.lastPongResponse > this.state.serverPingInterval + 1000) {
			console.log('Disconnecting player');
			// We should send a disconnect packet to player...
			this.connections.disconnect(entity);
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
