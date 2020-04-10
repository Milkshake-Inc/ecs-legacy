import { ClientChannel } from '@geckos.io/client';
import { ServerChannel } from '@geckos.io/server';
import { Packet, PacketOpcode } from '../components/Packet';
import { encode, decode } from '@msgpack/msgpack';

export default class Socket {
	public readonly id: string;
	protected socket: ServerChannel | ClientChannel;
	protected incoming: Packet[] = [];
	protected outgoing: Packet[] = [];

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
		this.socket.raw.emit(encode(packet));
	}

	public handleImmediate(handler: (packet: Packet) => void) {
		this.socket.onRaw(data => handler(decode(data as ArrayBuffer) as Packet));
	}

	public update() {
		this.outgoing.forEach(packet => this.socket.raw.emit(encode(packet)));
		this.incoming = [];
		this.outgoing = [];
	}
}
