import Socket from '../utils/Socket';

export default class Session {
	constructor(public id: string, public socket: Socket, public lastPongResponse: number = -1, public rtt: number = 0) {}
}
