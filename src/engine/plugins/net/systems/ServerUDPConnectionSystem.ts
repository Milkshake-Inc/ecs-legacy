import { Engine } from '../../../core/Engine';
import { Entity } from '../../../core/Entity';
import { GeckosServer, ServerChannel } from '@geckos.io/server';
import geckosServer from '@geckos.io/server/lib/geckos/server';
import { Packet } from '../components/Packet';
import Session from '../components/Session';
import { encode, decode } from '@msgpack/msgpack';
import { NetEvents } from '../components/NetEvents';
import ServerConnectionSystem from './ServerConnectionSystem';

const RELIABLE_MESSAGE = 'reliableRawMessage';

export default class ServerUDPConnectionSystem extends ServerConnectionSystem {
	protected server: GeckosServer;
	protected sockets: Map<Entity, ServerChannel> = new Map();

	constructor(engine: Engine) {
		super(engine);

		this.engine = engine;
		this.server = geckosServer({
			authorization: this.authorization
		});

		this.server.onConnection(this.handleConnection.bind(this));
		this.server.listen();
	}

	public sendTo(entity: Entity, packet: Packet, reliable = false): void {
		const session = entity.get(Session);
		const data = encode(packet);
		session.bytesOut += data.byteLength;

		const channel = this.sockets.get(entity);
		if (channel) {
			reliable ? channel.emit(RELIABLE_MESSAGE, data, { reliable: true }) : channel.raw.emit(data);
		} else {
			// console.warn(`tried sending to session ${session.id} where channel doesn't exist`);
		}
	}

	public send(packet: Packet, reliable = false): void {
		for (const entity of this.sockets.keys()) {
			this.sendTo(entity, packet, reliable);
		}
	}

	public sendExcept(exceptEntity: Entity, packet: Packet, reliable = false): void {
		const exceptId = exceptEntity.get(Session).id;
		for (const entity of this.sockets.keys()) {
			if (entity.get(Session).id != exceptId) {
				this.sendTo(entity, packet, reliable);
			}
		}
	}

	public disconnect(entity: Entity): void {
		const channel = this.sockets.get(entity);
		channel.close();
	}

	protected handleConnection(channel: ServerChannel): void {
		const entity = new Entity();
		this.sockets.set(entity, channel);

		const session = new Session(channel.userData['id']);
		entity.add(session);
		this.engine.addEntity(entity);

		channel.maxMessageSize = undefined;
		channel.onDisconnect(() => this.handleDisconnection(entity));
		channel.onRaw((data: ArrayBuffer) => this.handleMessage(entity, data));
		channel.on(RELIABLE_MESSAGE, (data: ArrayBuffer) => this.handleMessage(entity, Object.values(data)));

		console.log(`🔌 Socket connected ${session.id}`);
		this.events.emit(NetEvents.OnConnected, entity);
	}

	protected handleMessage(entity: Entity, data: ArrayLike<number> | ArrayBuffer): void {
		const session = entity.get(Session);
		session.bytesIn += data instanceof ArrayBuffer ? data.byteLength : data.length;

		const packet = decode(data) as Packet;
		this.events.emit(NetEvents.OnPacket, entity, packet);
	}

	protected handleDisconnection(entity: Entity): void {
		const session = entity.get(Session);
		this.engine.removeEntity(entity);
		this.sockets.delete(entity);

		console.log(`🔌 Socket disconnected ${session.id}`);
		this.events.emit(NetEvents.OnDisconnected, entity);
	}
}
