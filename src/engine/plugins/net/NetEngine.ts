import '@ecs/plugins/tools/ServerHooks'; // Needed to inject global variables used by some modules on server

import TickerEngine from '@ecs/core/TickerEngine';
import { GeckosServer } from '@geckos.io/server';
import ServerUDPConnectionSystem from './systems/ServerUDPConnectionSystem';
import ServerPingSystem from './systems/ServerPingSystem';
import ServerTCPConnectionSystem from './systems/ServerTCPConnectionSystem';

export class NetEngine extends TickerEngine {
	public server: GeckosServer;

	constructor(fps = 60, udp = false) {
		super(fps);

		if (udp) {
			this.addSystem(new ServerUDPConnectionSystem(this));
		} else {
			this.addSystem(new ServerTCPConnectionSystem(this));
		}

		this.addSystem(new ServerPingSystem(this.tickRate));
	}
}
