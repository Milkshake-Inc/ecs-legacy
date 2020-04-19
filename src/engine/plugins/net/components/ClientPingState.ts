export class ClientPingState {
	public tickInitialized: boolean;
	public rtt: number;
	public serverTime: number;
	public serverTick: number;
	public serverTickRateMs: number;

	// public get serverTickRateMs() {
	// 	return 1000 / this.serverTickRate;
	// }

	constructor() {}
}
