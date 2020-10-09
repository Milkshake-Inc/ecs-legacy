export default class Session {
	constructor(public id: string, public lastPongResponse: number = -1, public rtt: number = 0, public bytesIn = 0, public bytesOut = 0) {}
}
