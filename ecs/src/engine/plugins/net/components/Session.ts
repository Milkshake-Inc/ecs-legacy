import Socket from '../utils/Socket';

export default class Session {
	constructor(public socket: Socket, public lastPongResponse: number = -1, public rtt: number = 0) {}

	get id() {
		return this.socket.id;
	}
}
