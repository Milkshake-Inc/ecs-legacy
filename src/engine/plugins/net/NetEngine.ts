import '@ecs/plugins/tools/ServerHooks'; // Needed to inject global variables used by some modules on server

import TickerEngine from '@ecs/core/TickerEngine';
import { GeckosServer } from '@geckos.io/server';
import ServerUDPConnectionSystem from './systems/ServerUDPConnectionSystem';
import ServerPingSystem from './systems/ServerPingSystem';

export class NetEngine extends TickerEngine {
	public server: GeckosServer;

	constructor(fps = 60) {
		super(fps);

		this.addSystem(new ServerUDPConnectionSystem(this));
		this.addSystem(new ServerPingSystem(this.tickRate));
	}
}
