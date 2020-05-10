import '@ecs/utils/ServerHooks'; // Needed to inject global variables used by some modules on server

import TickerEngine from '@ecs/TickerEngine';
import geckosServer, { GeckosServer } from '@geckos.io/server/lib/server';
import ServerConnectionSystem from './systems/ServerConnectionSystem';
import ServerPingSystem from './systems/ServerPingSystem';

export class NetEngine extends TickerEngine {
	public server: GeckosServer;
	public connections: ServerConnectionSystem;

	constructor() {
		super(60);

		this.server = geckosServer();

		this.addSystem((this.connections = new ServerConnectionSystem(this, this.server)), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ServerPingSystem(this.tickRate));

		this.server.listen();
	}
}
