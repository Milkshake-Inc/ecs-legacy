import { Entity } from '@ecs/ecs/Entity';
import { Engine } from '@ecs/ecs/Engine';
import { makeQuery } from '@ecs/utils/QueryHelper';
import Session from '../components/Session';
import { Packet } from '../components/Packet';
import geckosClient, { ClientChannel } from '@geckos.io/client/lib/client';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';

export default class ClientConnectionSystem extends IterativeSystem {
	private engine: Engine;
	private socket: ClientChannel;
	private session: Entity;

	constructor(engine: Engine) {
		super(makeQuery());

		this.engine = engine;
		this.socket = geckosClient();

		this.socket.onConnect(this.handleConnection.bind(this));
		this.socket.onDisconnect(this.handleDisconnection.bind(this));

		console.log(`🔌 Server started!`);
	}

	protected handleConnection(error?: Error) {
		if (error) {
			console.log(`🔌 Socket failed to connect`);
			throw error;
		}

		this.session = new Entity();
		this.session.add(Session, { id: this.socket.id, socket: this.socket });
		this.engine.addEntity(this.session);

		this.socket.on('message', this.handleMessage.bind(this));

		console.log(`🔌 Socket connected ${this.socket.id}`);
	}

	protected handleDisconnection() {
		this.engine.removeEntity(this.session);
		this.session = null;

		console.log(`🔌 Socket disconnected`);
	}

	protected handleMessage(packet: Packet) {
		this.session.get(Session).incoming.push(packet);
	}

	protected updateEntity(entity: Entity): void {}

	public update(deltaTime: number) {
		if (!this.session) return;
		const session = this.session.get(Session);
		session.outgoing.forEach(packet => session.socket.emit('message', packet));
		session.outgoing = [];
		session.incoming = [];
	}
}
