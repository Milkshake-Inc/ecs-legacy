import { Entity } from '@ecs/core/Entity';
import { Engine } from '@ecs/core/Engine';
import { useEvents, useState } from '@ecs/core/helpers';
import { NetEvents } from '../components/NetEvents';
import { decode } from '@msgpack/msgpack';
import { Packet } from '../components/Packet';
import { System } from '@ecs/core/System';

export class ConnectionStatistics {
	public connected = false;
	public bytesIn = 0;
	public bytesOut = 0;
}

export default abstract class ClientConnectionSystem extends System {
	protected engine: Engine;
	protected sessionEntity: Entity;
	protected events = useEvents();
	protected time = 0;
	protected state = useState(this, new ConnectionStatistics());

	constructor(engine: Engine) {
		super();
		this.engine = engine;

		this.events = useEvents();
		this.events.on(NetEvents.Disconnect, this.disconnect.bind(this));
		this.events.on(NetEvents.Send, this.send.bind(this));
		this.events.on(NetEvents.SendTo, (_, packet, reliable) => this.send(packet, reliable));

		console.log(`🔌 Connecting to server...!`);
		this.connect(localStorage.getItem('token'));
	}

	protected abstract connect(token?: string): void;

	public abstract disconnect(): void;

	public abstract send(packet: Packet, reliable: boolean): void;

	protected handleMessage(data: ArrayLike<number> | ArrayBuffer): void {
		this.state.bytesIn += data instanceof ArrayBuffer ? data.byteLength : data.length;

		const packet = decode(data) as Packet;
		if (packet) {
			this.events.emit(NetEvents.OnPacket, this.sessionEntity, packet);
		}
	}

	protected handleDisconnection() {
		this.events.emit(NetEvents.OnDisconnected, this.sessionEntity);

		this.state.connected = false;

		if (this.sessionEntity) {
			this.engine.removeEntity(this.sessionEntity);
			this.sessionEntity = null;
		}

		console.log(`🔌 Socket disconnected`);
		console.log(`🔌 Reconnecting...`);
		setTimeout(() => this.connect(localStorage.getItem('token')), 1000);
	}
}
