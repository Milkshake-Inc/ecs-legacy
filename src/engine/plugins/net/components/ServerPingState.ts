export class ServerPingState {
	public serverTime: number;
	public serverTick: number;
	public serverTickRate: number;
	public serverPingInterval: number;
	public timeSinceLastPing: number;

	public get serverTickRateMs() {
		return 1000 / this.serverTickRate;
	}

	constructor(serverTickRate: number, serverPingInterval = 5000) {
		this.serverTickRate = serverTickRate;
		this.serverPingInterval = serverPingInterval;

		this.serverTime = 0;
		this.serverTick = 0;
		this.timeSinceLastPing = -1;
	}
}
