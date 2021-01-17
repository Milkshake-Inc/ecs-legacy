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

export const ReconnectInterval = 1000;

export default class ClientTCPConnectionSystem extends ClientConnectionSystem {
	protected socket: WebSocket;
	protected url: string;

	protected connect(token = 'guest') {
		if (!this.url) {
			const vars = QueryString.parse(window.location.search);
			const socket = vars['ws'] || `${window.location.hostname}`;
			const protocol = window.location.protocol == 'https:' ? 'wss:' : 'ws:';
			this.url = `${protocol}//${socket}:9001`;
		}

		this.socket = new WebSocket(this.url, token);
		this.socket.binaryType = 'arraybuffer';

		this.socket.onopen = this.handleConnection.bind(this);
		this.socket.onmessage = message => this.handleMessage(message.data);
		this.socket.onclose = this.handleDisconnection.bind(this);
		this.socket.onerror = e => {
			console.error(e);
			this.handleDisconnection();
		};
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
		// persist session
		localStorage.setItem('token', token);

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
		} else if (packet) {
			this.events.emit(NetEvents.OnPacket, this.sessionEntity, packet);
		}
	}

	protected reconnect() {
		if (!this.state.connected) {
			console.log('attempting reconnect...');

			setTimeout(() => this.connect(localStorage.getItem('token')), ReconnectInterval);
		}
	}
}
