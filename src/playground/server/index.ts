import TickerEngine from '@ecs/TickerEngine';
import { performance } from 'perf_hooks';
import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import ServerPingSystem from '@ecs/plugins/net/systems/ServerPingSystem';
import geckosServer, { GeckosServer } from '@geckos.io/server/lib/server';

class NetEngine extends TickerEngine {
	public server: GeckosServer;

	constructor() {
		super(60);

		this.server = geckosServer();

		this.addSystem(new ServerConnectionSystem(this, this.server), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ServerPingSystem(this.server));

		this.server.listen();
	}

	protected getTime(): number {
		return performance.now();
	}
}

new NetEngine();
