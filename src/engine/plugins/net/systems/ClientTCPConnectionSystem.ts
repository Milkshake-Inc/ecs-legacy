import { Entity } from '@ecs/core/Entity';
import Session from '../components/Session';
import { NetEvents } from '../components/NetEvents';
import { decode, encode } from '@msgpack/msgpack';
import { Packet, PacketOpcode, SessionUpdate } from '../components/Packet';
import ClientConnectionSystem from './ClientConnectionSystem';
import * as QueryString from 'query-string';

export class ConnectionStatistics {
	public connected = false;
	public bytesIn = 0;
	public bytesOut = 0;
}

export default class ClientTCPConnectionSystem extends ClientConnectionSystem {
	protected socket: WebSocket;

	protected connect(token = '') {
		const vars = QueryString.parse(window.location.search);
		const socket = vars['ws'] || `${window.location.hostname}`;
		const protocol = window.location.protocol == 'https:' ? 'wss:' : 'ws:';
		const url = `${protocol}//${socket}:3001`;

		this.socket = new WebSocket(url, token || 'guest');
		this.socket.binaryType = 'arraybuffer';

		this.socket.onopen = this.handleConnection.bind(this);
		this.socket.onmessage = message => this.handleMessage(message.data);
		this.socket.onclose = this.handleDisconnection.bind(this);
	}

	public disconnect(code?: number, message?: string): void {
		this.socket.close(code, message);
	}

	public send(packet: Packet, reliable = false): void {
		const data = encode(packet);
		this.state.bytesOut += data.byteLength;

		this.socket.send(data);
	}

	protected handleConnection() {
		console.log(`🔌 Connected!`);
	}

	protected handleSessionUpdated({ id, token }: SessionUpdate) {
		this.sessionEntity = new Entity();
		const session = new Session(id);
		this.sessionEntity.add(session);
		this.engine.addEntity(this.sessionEntity);

		this.state.connected = true;
		console.log(`🔌 Session established ${session.id}`);
		this.events.emit(NetEvents.OnConnected, this.sessionEntity);
	}

	protected handleMessage(data: ArrayLike<number> | ArrayBuffer): void {
		this.state.bytesIn += data instanceof ArrayBuffer ? data.byteLength : data.length;

		const packet = decode(data) as Packet;

		if (packet.opcode == PacketOpcode.SESSION_UPDATE) {
			this.handleSessionUpdated(packet);
		} else {
			console.log('got packet', packet);
			this.events.emit(NetEvents.OnPacket, this.sessionEntity, packet);
		}
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
