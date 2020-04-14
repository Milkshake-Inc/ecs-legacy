import { PacketOpcode } from '../components/Packet';
import { makeQuery, any } from '@ecs/utils/QueryHelper';
import { EntitySnapshot, Entity } from '@ecs/ecs/Entity';
import Session from '../components/Session';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';

export default class ClientPingSystem extends IterativeSystem {
	public tickInitialized: boolean;
	public rtt: number;
	public serverTime: number;
	public serverTick: number;
	public serverTickRateMs: number;

	constructor() {
		super(makeQuery(any(Session)));
	}

	public updateFixed(deltaTime: number) {
		if (this.tickInitialized) {
			this.serverTime += deltaTime;
			this.serverTick = Math.floor(this.serverTime / this.serverTickRateMs);
		}

		super.updateFixed(deltaTime);
	}

	protected updateEntityFixed(entity: Entity, dt: number): void {
		const session = entity.get(Session);
		session.serverTime = this.serverTime;
		session.serverTick = this.serverTick;
	}

	protected entityAdded = (entity: EntitySnapshot) => {
		const session = entity.get(Session);

		session.socket.handleImmediate(packet => {
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
					this.rtt = performance.now() - packet.clientTime;

					this.serverTickRateMs = packet.serverTickRateMs;

					let newServerTime = packet.serverTime + this.rtt / 2;
					// We push the client ahead of time HRTT + 1 Tick (Hacked to 2)
					newServerTime += this.rtt / 2 + this.serverTickRateMs * 1;

					console.log(
						`Client estimated RTT: ${this.rtt} ServerTime: ${packet.serverTime} Estimated ServerTime: ${this.serverTime}`
					);

					if (this.serverTime) {
						console.log(`⏱ Server time diff ${this.serverTime - newServerTime}`);
					} else {
						console.log(`⏱ Server time set ${newServerTime}`);
					}

					if (!this.tickInitialized) {
						this.serverTime = newServerTime;
					}

					this.tickInitialized = true;
				}
			}
		});
	};
}
