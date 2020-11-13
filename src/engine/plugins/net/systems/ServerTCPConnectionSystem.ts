import { Engine } from '../../../core/Engine';
import { Entity } from '../../../core/Entity';
import { Packet, PacketOpcode } from '../components/Packet';
import Session from '../components/Session';
import { encode, decode } from '@msgpack/msgpack';
import { NetEvents } from '../components/NetEvents';
import ServerConnectionSystem from './ServerConnectionSystem';
import uws, { TemplatedApp } from 'uWebSockets.js';

export default class ServerTCPConnectionSystem extends ServerConnectionSystem {
	protected server: TemplatedApp;
	protected sockets: Map<Entity, uws.WebSocket> = new Map();

	constructor(engine: Engine, port = 9001) {
		super(engine);

		this.engine = engine;
		this.server = uws
			.App({})
			.ws('/*', {
				compression: uws.SHARED_COMPRESSOR,
				maxPayloadLength: 16 * 1024 * 1024,
				idleTimeout: 10,
				maxBackpressure: 1024,
				/* Handlers */
				upgrade: async (res, req, context) => {
					const secWebSocketKey = req.getHeader('sec-websocket-key');
					const secWebSocketProtocol = req.getHeader('sec-websocket-protocol');
					const secWebSocketExtensions = req.getHeader('sec-websocket-extensions');

					const { token, id } = await this.authorization(secWebSocketProtocol);
					res.upgrade({ token, id }, secWebSocketKey, secWebSocketProtocol, secWebSocketExtensions, context);
				},
				open: this.handleConnection.bind(this),
				message: this.handleMessage.bind(this),
				close: this.handleDisconnection.bind(this)
			})
			.listen(port, listenSocket => {
				console.log('server listening on', port);
			});
	}

	public sendTo(entity: Entity, packet: Packet, reliable = false): void {
		this.sendToRaw(entity, encode(packet), reliable);
	}

	public sendToRaw(entity: Entity, rawPacket: Uint8Array, reliable = false): void {
		const session = entity.get(Session);
		const socket = this.sockets.get(entity);

		session.bytesOut += rawPacket.byteLength;

		if (socket) {
			socket.send(rawPacket, true, true);
		} else {
			// console.warn(`tried sending to session ${session.id} where id doesn't exist`);
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

	public disconnect(entity: Entity, code?: number, message?: string): void {
		const socket = this.sockets.get(entity);
		socket.end(code, message);
	}

	protected handleConnection(socket: uws.WebSocket): void {
		console.log('connection!');

		const entity = new Entity();
		this.sockets.set(entity, socket);

		// hacky
		socket.entity = entity;

		const session = new Session(socket.id);
		entity.add(session);
		this.engine.addEntity(entity);

		console.log(`🔌 Socket connected ${session.id}`);

		this.sendTo(entity, {
			opcode: PacketOpcode.SESSION_UPDATE,
			token: socket.token,
			id: socket.id
		});
		this.events.emit(NetEvents.OnConnected, entity);
	}

	protected handleMessage(ws: uws.WebSocket, data: ArrayBuffer, isBinary: boolean): void {
		const entity = ws.entity as Entity;
		const session = entity.get(Session);
		session.bytesIn += data.byteLength;

		const packet = decode(data) as Packet;
		if (packet) {
			this.events.emit(NetEvents.OnPacket, entity, packet);
		}
	}

	protected handleDisconnection(ws: uws.WebSocket, code: number, message: ArrayBuffer): void {
		const entity = ws.entity as Entity;
		if (!entity) return;
		const session = entity.get(Session);

		this.engine.removeEntity(entity);
		this.sockets.delete(entity);

		console.log(`🔌 Socket disconnected ${session.id}`);
		this.events.emit(NetEvents.OnDisconnected, entity);
	}
}
