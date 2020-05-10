import ServerConnectionSystem from '@ecs/plugins/net/systems/ServerConnectionSystem';
import ServerPingSystem from '@ecs/plugins/net/systems/ServerPingSystem';
import TickerEngine from '@ecs/TickerEngine';
import geckosServer, { GeckosServer } from '@geckos.io/server/lib/server';
import { Entity } from '@ecs/ecs/Entity';
import { ShipBase } from './spaces/ShipBase';
import { ShipServer } from './spaces/ShipServer';

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

const engine = new NetEngine();
const spaces = new Entity();
spaces.add(new ShipBase(engine, true));
spaces.add(new ShipServer(engine, true));
engine.addEntity(spaces);

console.log('🎉 Server');
