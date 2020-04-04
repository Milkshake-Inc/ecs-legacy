import { performance } from 'perf_hooks';
import { PacketOpcode } from '../components/Packet';
import { makeQuery, any } from '@ecs/utils/QueryHelper';
import { GeckosServer } from '@geckos.io/server/lib/server';
import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import Session from '../components/Session';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';

export default class ServerPingSystem extends IterativeSystem {
	private serverTime = 0;
	private serverTick = 0;
	private serverTickRateMs: number = 1000 / 60;
	private serverPingInterval = 10000;
	private timeSinceLastPing = 0;
	private server: GeckosServer;

	constructor(server: GeckosServer) {
		super(makeQuery(any(Session)));
		this.server = server;
	}

	public update(deltaTime: number) {
		super.update(deltaTime);

		this.serverTime += deltaTime;
		this.timeSinceLastPing += deltaTime;
		this.serverTick = Math.floor(this.serverTime / this.serverTickRateMs);

		if (this.timeSinceLastPing >= this.serverPingInterval) {
			this.timeSinceLastPing = 0;
			this.server.emit('message', {
				opcode: PacketOpcode.SERVER_SYNC_PING,
				serverTime: performance.now()
			});

			console.log(`⏱ Sending ping`);
		}
	}

	protected updateEntity(entity: Entity): void {
		const session = entity.get(Session);
		session.incoming.forEach(packet => {
			switch (packet.opcode) {
				case PacketOpcode.CLIENT_SYNC_PONG: {
					const rtt = performance.now() - packet.serverTime;
					console.log(`⏱ Server estimated RTT: ${rtt}`);
					session.outgoing.push({
						opcode: PacketOpcode.SERVER_SYNC_RESULT,
						clientTime: packet.clientTime,
						serverTime: this.serverTime,
						serverTick: this.serverTick,
						serverTickRateMs: this.serverTickRateMs
					});
				}
			}
		});
	}

	protected entityAdded = (entity: EntitySnapshot) => {
		const session = entity.get(Session);
		session.outgoing.push({
			opcode: PacketOpcode.SERVER_SYNC_PING,
			serverTime: performance.now()
		});
	};
}
