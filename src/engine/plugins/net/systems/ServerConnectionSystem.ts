import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { StatefulIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { GeckosServer, ServerChannel } from '@geckos.io/server/lib/server';
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
}

export default class ServerConnectionSystem extends StatefulIterativeSystem<ServerConnectionState> {
	private engine: Engine;
	private server: GeckosServer;

	constructor(engine: Engine, server: GeckosServer) {
		super(makeQuery(any(Session)), new ServerConnectionState());

		this.engine = engine;
		this.server = server;

		this.state.broadcast = this.broadcast.bind(this);
		this.state.disconnect = this.disconnect.bind(this);

		this.server.onConnection(this.handleConnection.bind(this));

		console.log(`🔌 Server started!`);
	}

	public broadcast(packet: Packet, immediate = false) {
		for (const entity of this.query.entities) {
			const socket = entity.get(Session).socket;
			immediate ? socket.sendImmediate(packet) : socket.send(packet);
		}
	}

	public disconnect(entity: Entity) {
		this.handleDisconnection(entity);
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
		console.log(`🔌 Socket disconnected ${session.id}`);
		this.engine.removeEntity(entity);
		session.socket.disconnect();
	}

	protected updateEntityFixed(entity: Entity): void {
		entity.get(Session)?.socket.update();
	}
}
