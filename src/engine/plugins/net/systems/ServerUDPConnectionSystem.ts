import { Engine } from '../../../core/Engine';
import { Entity } from '../../../core/Entity';
import { useSimpleEvents } from '../../../core/helpers';
import { GeckosServer, ServerChannel } from '@geckos.io/server';
import geckosServer from '@geckos.io/server/lib/geckos/server';
import { sign, verify } from 'jsonwebtoken';
import { uuid } from 'uuidv4';
import { Packet } from '../components/Packet';
import Session from '../components/Session';
import { encode, decode } from '@msgpack/msgpack';
import { System } from '../../../core/System';
import { NetEvents } from '../components/NetEvents';

const secret = 'somethingsupersecretyo';
const RELIABLE_MESSAGE = 'reliableRawMessage';

interface JWTData {
	id: string;
}

export default class ServerUDPConnectionSystem extends System {
	protected engine: Engine;
	protected server: GeckosServer;
	protected events = useSimpleEvents();
	protected sockets: Map<Entity, ServerChannel> = new Map();

	constructor(engine: Engine) {
		super();

		this.engine = engine;

		this.events = useSimpleEvents();
		this.events.on(NetEvents.Disconnect, this.disconnect.bind(this));
		this.events.on(NetEvents.Send, this.send.bind(this));
		this.events.on(NetEvents.SendTo, this.sendTo.bind(this));
		this.events.on(NetEvents.SendExcept, this.sendExcept.bind(this));

		this.server = geckosServer({
			authorization: async token => {
				// If token exists, verify it and return as userData for client to get existing user.
				if (token) {
					try {
						const { id } = verify(token, secret) as JWTData;
						return { token, id };
					} catch (e) {
						console.warn(`invalid token ${token}. Generating new one...`);
					}
				}

				// Generate new user
				const id = uuid();
				token = sign({ id: id }, secret, {
					expiresIn: '1 day'
				});
				return { token, id };
			}
		});

		this.server.onConnection(this.handleConnection.bind(this));
		console.log(`🔌 Server started!`);
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
			console.warn(`tried sending to session ${session.id} where channel doesn't exist`);
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
