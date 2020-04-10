import { Entity } from '@ecs/ecs/Entity';
import { Engine } from '@ecs/ecs/Engine';
import { makeQuery } from '@ecs/utils/QueryHelper';
import Session from '../components/Session';
import geckosClient, { ClientChannel } from '@geckos.io/client/lib/client';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Socket from '../utils/Socket';

export default class ClientConnectionSystem extends IterativeSystem {
	private engine: Engine;
	private socket: Socket;
	private session: Entity;

	constructor(engine: Engine) {
		super(makeQuery());
		this.engine = engine;

		const client = geckosClient();

		client.onConnect(error => this.handleConnection(client, error));
		client.onDisconnect(() => this.handleDisconnection());

		console.log(`🔌 Server started!`);
	}

	protected handleConnection(client: ClientChannel, error?: Error) {
		if (error) {
			console.log(`🔌 Socket failed to connect`);
			throw error;
		}

		this.session = new Entity();
		this.session.add(Session, { id: client.id, socket: this.socket = new Socket(client) });
		this.engine.addEntity(this.session);

		console.log(`🔌 Socket connected ${this.socket.id}`);
	}

	protected handleDisconnection() {
		this.engine.removeEntity(this.session);
		this.session = null;

		console.log(`🔌 Socket disconnected`);
	}

	public update(deltaTime: number) {
		this.session?.get(Session)?.socket.update();
	}
}
