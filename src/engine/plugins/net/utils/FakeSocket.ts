import Socket from './Socket';
import { uuid } from 'uuidv4';
import { Packet } from '../components/Packet';

export class FakeChannel {
	public maxMessageSize: number;
	public userData: any;

	constructor(id: string) {
		this.userData = {
			id
		};
	}

	onRaw() {}

	on() {}

	close() {}

	emit() {}

	get raw() {
		return this;
	}
}

export default class FakeSocket extends Socket {
	constructor(id = uuid()) {
		super(new FakeChannel(id));
	}

	public emulatePacket<TPacketType = Packet>(packet: TPacketType) {
		this.handlers.forEach(h => h(packet as any));
	}
}
