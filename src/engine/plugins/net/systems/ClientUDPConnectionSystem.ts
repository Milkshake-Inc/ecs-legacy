import { Entity } from '@ecs/core/Entity';
import { Engine } from '@ecs/core/Engine';
import { makeQuery } from '@ecs/core/Query';
import Session from '../components/Session';
import geckosClient, { ClientChannel } from '@geckos.io/client';
import { IterativeSystem } from '@ecs/core/IterativeSystem';
import { useSimpleEvents, useState } from '@ecs/core/helpers';
import { NetEvents } from '../components/NetEvents';
import { decode, encode } from '@msgpack/msgpack';
import { Packet } from '../components/Packet';

export class ConnectionStatistics {
	public connected = false;
	public bytesIn = 0;
	public bytesOut = 0;
}

const RELIABLE_MESSAGE = 'reliableRawMessage';

export default class ClientUDPConnectionSystem extends IterativeSystem {
	private engine: Engine;
	private sessionEntity: Entity;
	private channel: ClientChannel;
	protected events = useSimpleEvents();

	private time = 0;

	private state = useState(this, new ConnectionStatistics());

	constructor(engine: Engine) {
		super(makeQuery());
		this.engine = engine;

		this.events = useSimpleEvents();
		this.events.on(NetEvents.Disconnect, this.disconnect.bind(this));
		this.events.on(NetEvents.Send, this.send.bind(this));

		console.log(`🔌 Connecting to server...!`);
		this.connect(); // localStorage.getItem('token'); // <-- persist connections
	}

	protected connect(token = '') {
		const client = geckosClient({
			authorization: token
		});

		client.onConnect(error => this.handleConnection(client, error));
		client.onDisconnect(() => this.handleDisconnection());
	}

	public disconnect(): void {
		this.channel.close();
	}

	public send(packet: Packet, reliable = false): void {
		const data = encode(packet);
		this.state.bytesOut += data.byteLength;

		reliable ? this.channel.emit(RELIABLE_MESSAGE, data, { reliable: true }) : this.channel.raw.emit(data);
	}

	protected handleConnection(channel: ClientChannel, error?: Error) {
		console.log(`🔌 Connected!`);

		if (error) {
			console.log(`🔌 Socket failed to connect`);
			setTimeout(() => this.connect(localStorage.getItem('token')), 1000);
			throw error;
		}

		this.state.connected = true;

		// Persist session
		const token = channel.userData['token'];
		localStorage.setItem('token', token);

		this.channel = channel;
		this.sessionEntity = new Entity();
		const session = new Session(channel.userData['id']);
		this.sessionEntity.add(session);
		this.engine.addEntity(this.sessionEntity);

		channel.maxMessageSize = undefined;
		channel.onRaw((data: ArrayBuffer) => this.handleMessage(data));
		channel.on(RELIABLE_MESSAGE, (data: ArrayBuffer) => this.handleMessage(Object.values(data)));

		console.log(`🔌 Socket connected ${session.id}`);
		this.events.emit(NetEvents.OnConnected, this.sessionEntity);
	}

	protected handleMessage(data: ArrayLike<number> | ArrayBuffer): void {
		this.state.bytesIn += data instanceof ArrayBuffer ? data.byteLength : data.length;

		const packet = decode(data) as Packet;
		this.events.emit(NetEvents.OnPacket, this.sessionEntity, packet);
	}

	protected handleDisconnection() {
		this.events.emit(NetEvents.OnDisconnected, this.sessionEntity);

		this.state.connected = false;
		this.engine.removeEntity(this.sessionEntity);
		this.sessionEntity = null;

		console.log(`🔌 Socket disconnected`);
		console.log(`🔌 Reconnecting...`);
		setTimeout(() => this.connect(localStorage.getItem('token')), 1000);
	}
}
