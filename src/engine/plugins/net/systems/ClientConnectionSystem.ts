import { Entity } from '@ecs/ecs/Entity';
import { Engine } from '@ecs/ecs/Engine';
import { makeQuery } from '@ecs/utils/QueryHelper';
import Session from '../components/Session';
import geckosClient, { ClientChannel } from '@geckos.io/client/lib/client';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Socket from '../utils/Socket';
import { useState } from '@ecs/ecs/helpers/StatefulSystems';

export class ConnectionStatistics {
	public bytesIn = 0;
	public bytesOut = 0;
}

export default class ClientConnectionSystem extends IterativeSystem {
	private engine: Engine;
	private socket: Socket;
	private sessionEntity: Entity;
	private time = 0;

	private state = useState(this, new ConnectionStatistics());

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

		this.sessionEntity = new Entity();
		this.sessionEntity.add(Session, { id: client.id, socket: this.socket = new Socket(client) });
		this.engine.addEntity(this.sessionEntity);

		console.log(`🔌 Socket connected ${this.socket.id}`);
	}

	protected handleDisconnection() {
		this.engine.removeEntity(this.sessionEntity);
		this.sessionEntity = null;

		console.log(`🔌 Socket disconnected`);
	}

	public updateFixed(deltaTime: number) {
		this.time += deltaTime;

		if (this.sessionEntity) {
			const { socket } = this.sessionEntity.get(Session);

			socket.update();

			if (this.time >= 1000) {
				this.state.bytesIn = socket.bytesIn;
				this.state.bytesOut = socket.bytesOut;

				socket.bytesIn = 0;
				socket.bytesOut = 0;

				this.time -= 1000;
			}
		}
	}
}
