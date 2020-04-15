import { ClientChannel } from '@geckos.io/client';
import { ServerChannel } from '@geckos.io/server';
import { Packet, PacketOpcode } from '../components/Packet';
import { encode, decode } from '@msgpack/msgpack';

export default class Socket {
	public readonly id: string;
	protected socket: ServerChannel | ClientChannel;
	protected incoming: Packet[] = [];
	protected outgoing: Packet[] = [];

	private serverLagRTT = 100;

	constructor(socket: ServerChannel | ClientChannel) {
		this.socket = socket;
		this.id = socket.id;

		this.handleImmediate(p => this.receive(p));
	}

	public send(packet: Packet) {
		this.outgoing.push(packet);
	}

	protected receive(packet: Packet) {
		this.incoming.push(packet);
	}

	public handle<T extends Packet>(opcode: PacketOpcode): T[] {
		return this.incoming.filter(p => p.opcode == opcode) as T[];
	}

	public sendImmediate(packet: Packet) {
		// setTimeout(() => {
			this.socket.raw.emit(encode(packet));
		// }, this.socket instanceof ServerChannel ? this.serverLagRTT / 2 : 0);

	}

	public handleImmediate(handler: (packet: Packet) => void) {
		this.socket.onRaw(data => {
			// setTimeout(() => {
			handler(decode(data as ArrayBuffer) as Packet)
			// }, this.serverLagRTT / 2);
		});
	}

	public update() {
		this.outgoing.forEach(packet => this.socket.raw.emit(encode(packet)));
		this.incoming = [];
		this.outgoing = [];
	}

	public disconnect() {
		if (this.socket instanceof ServerChannel) {
			this.socket.close();
			this.socket.eventEmitter.removeAllListeners();
		}
	}
}
