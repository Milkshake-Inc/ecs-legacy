import { performance } from 'perf_hooks';
import { PacketOpcode } from '../components/Packet';
import { makeQuery, any } from '@ecs/utils/QueryHelper';
import { EntitySnapshot, Entity } from '@ecs/ecs/Entity';
import Session from '../components/Session';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import ServerConnectionSystem from './ServerConnectionSystem';

export default class ServerPingSystem extends IterativeSystem {
	private serverTime = 0;
	private serverTick = 0;
	private serverTickRateMs: number = 1000 / 60;
	private serverPingInterval = 5000;
	private timeSinceLastPing = 0;
	private connections: ServerConnectionSystem;

	constructor(connections: ServerConnectionSystem) {
		super(makeQuery(any(Session)));
		this.connections = connections;
	}

	public get tick() {
		return this.serverTick;
	}

	public update(deltaTime: number) {
		this.serverTime += deltaTime;
		this.timeSinceLastPing += deltaTime;
		this.serverTick = Math.floor(this.serverTime / this.serverTickRateMs);

		if (this.timeSinceLastPing >= this.serverPingInterval) {
			this.timeSinceLastPing = 0;

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
		session.serverTick = this.serverTick;
		session.serverTime = this.serverTime;

		if (session.lastPongResponse != -1 && performance.now() - session.lastPongResponse > this.serverPingInterval + 1000) {
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
						serverTime: this.serverTime,
						serverTick: this.serverTick,
						serverTickRateMs: this.serverTickRateMs
					});
				}
			}
		});
	};
}
