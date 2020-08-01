import { ClientChannel } from '@geckos.io/client';
import { ServerChannel } from '@geckos.io/server';
import { Packet, PacketOpcode } from '../components/Packet';
import { encode, decode } from '@msgpack/msgpack';

export type PacketHandler = (packet: Packet) => void;
const RELIABLE_MESSAGE = 'reliableRawMessage';

export default class Socket {
	public readonly id: string;
	protected socket: ServerChannel | ClientChannel;
	protected incoming: Packet[] = [];
	protected handlers: PacketHandler[] = [];

	public bytesIn = 0;
	public bytesOut = 0;

	constructor(socket: ServerChannel | ClientChannel) {
		this.socket = socket;
		this.id = socket.userData['id'];

		this.socket.onRaw((data: ArrayBuffer) => this.onMessage(data));
		this.socket.on(RELIABLE_MESSAGE, (data: ArrayBuffer) => this.onMessage(Object.values(data)));
	}

	public handle<T extends Packet>(opcode: PacketOpcode): T[] {
		return this.incoming.filter(p => p.opcode == opcode) as T[];
	}

	public handleImmediate(handler: (packet: Packet) => void) {
		this.handlers.push(handler);
	}

	public send<TPacketType = Packet>(packet: TPacketType, reliable = false) {
		const data = encode(packet);
		// TODO: Update Geckos https://github.com/geckosio/geckos.io/issues/41
		this.socket.maxMessageSize = undefined;
		reliable ? this.emitReliable(data) : this.emit(data);
	}

	public disconnect() {
		// if (this.socket instanceof ServerChannel) {
		this.socket.close();
		// this.socket.eventEmitter.removeAllListeners();
		// }
	}

	public update() {
		this.incoming = [];
	}

	protected onMessage(data: ArrayLike<number> | ArrayBuffer) {
		this.bytesIn += data instanceof ArrayBuffer ? data.byteLength : data.length;

		const packet = decode(data) as Packet;
		this.incoming.push(packet);
		this.handlers.forEach(h => h(packet));
	}

	protected emit(data: ArrayBuffer) {
		this.bytesOut += data.byteLength;
		this.socket.raw.emit(data);
	}

	protected emitReliable(data: ArrayBuffer) {
		this.bytesOut += data.byteLength;
		this.socket.emit(RELIABLE_MESSAGE, data, { reliable: true });
	}
}
