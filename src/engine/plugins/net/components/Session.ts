import Socket from '../utils/Socket';

export default class Session {
	constructor(public id: string, public socket: Socket, public serverTime = 0, public serverTick = 0) {}
}
