import { ServerChannel, GeckosServer } from '@geckos.io/server/lib/server';
import { Entity } from '@ecs/ecs/Entity';
import { Engine } from '@ecs/ecs/Engine';
import { makeQuery, any } from '@ecs/utils/QueryHelper';
import Session from '../components/Session';
import { Packet } from '../components/Packet';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Socket from '../utils/Socket';

export default class ServerConnectionSystem extends IterativeSystem {
	private engine: Engine;
	private server: GeckosServer;

	constructor(engine: Engine, server: GeckosServer) {
		super(makeQuery(any(Session)));

		this.engine = engine;
		this.server = server;

		this.server.onConnection(this.handleConnection.bind(this));

		console.log(`🔌 Server started!`);
	}

	public broadcast(packet: Packet, immediate = false) {
		for (const entity of this.query.entities) {
			const socket = entity.get(Session).socket;
			immediate ? socket.sendImmediate(packet) : socket.send(packet);
		}
	}

	protected handleConnection(socket: ServerChannel) {
		console.log(`🔌 Socket connected ${socket.id}`);

		const session = new Entity();
		session.add(Session, { id: socket.id, socket: new Socket(socket) });
		this.engine.addEntity(session);

		socket.onDisconnect(() => this.handleDisconnection(session));
	}

	protected handleDisconnection(entity: Entity) {
		const session = entity.get(Session);
		console.log(`🔌 Socket connected ${session.id}`);
		this.engine.removeEntity(entity);
	}

	protected updateEntity(entity: Entity): void {
		entity.get(Session)?.socket.update();
	}
}
