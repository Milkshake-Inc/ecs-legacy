import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useState } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { all, any, makeQuery } from '@ecs/ecs/Query';
import { GeckosServer, ServerChannel } from '@geckos.io/server';
import { Packet } from '../components/Packet';
import Session from '../components/Session';
import Socket from '../utils/Socket';

export class ServerConnectionState {
	broadcast: ServerConnectionSystem['broadcast'];
	disconnect: ServerConnectionSystem['disconnect'];

	constructor() {}
}

export const ServerConnectionQuery = {
	serverConnection: makeQuery(all(ServerConnectionState))
};

export default class ServerConnectionSystem extends IterativeSystem {
	protected state = useState(this, new ServerConnectionState());

	private engine: Engine;
	private server: GeckosServer;

	constructor(engine: Engine, server: GeckosServer) {
		super(makeQuery(any(Session)));

		this.engine = engine;
		this.server = server;

		this.state.broadcast = this.broadcast.bind(this);
		this.state.disconnect = this.disconnect.bind(this);

		this.server.onConnection(this.handleConnection.bind(this));

		console.log(`🔌 Server started!`);
	}

	public broadcast(packet: Packet, reliable = false) {
		for (const entity of this.query.entities) {
			entity.get(Session).socket.send(packet, reliable);
		}
	}

	public disconnect(entity: Entity) {
		const session = entity.get(Session);
		session.socket.disconnect();
	}

	protected handleConnection(channel: ServerChannel) {
		const session = new Entity();
		const socket = new Socket(channel);
		session.add(Session, { socket });
		this.engine.addEntity(session);

		channel.onDisconnect(() => this.handleDisconnection(session));

		console.log(`🔌 Socket connected ${socket.id}`);
	}

	protected handleDisconnection(entity: Entity) {
		const session = entity.get(Session);
		this.engine.removeEntity(entity);

		console.log(`🔌 Socket disconnected ${session.id}`);
	}

	protected updateEntityFixed(entity: Entity): void {
		entity.get(Session)?.socket.update();
	}
}
