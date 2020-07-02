import { Entity } from '@ecs/ecs/Entity';
import { Engine } from '@ecs/ecs/Engine';
import { makeQuery } from '@ecs/utils/QueryHelper';
import Session from '../components/Session';
import geckosClient, { ClientChannel } from '@geckos.io/client';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Socket from '../utils/Socket';
import { useState } from '@ecs/ecs/helpers';

export class ConnectionStatistics {
	public bytesIn = 0;
	public bytesOut = 0;
}

export default class ClientConnectionSystem extends IterativeSystem {
	private engine: Engine;
	private sessionEntity: Entity;
	private time = 0;

	private state = useState(this, new ConnectionStatistics());

	constructor(engine: Engine) {
		super(makeQuery());
		this.engine = engine;

		const client = geckosClient({
			authorization: '' // localStorage.getItem('token'); // <-- persist connections
		});

		client.onConnect(error => this.handleConnection(client, error));
		client.onDisconnect(() => this.handleDisconnection());

		console.log(`🔌 Server started!`);
	}

	protected handleConnection(channel: ClientChannel, error?: Error) {
		if (error) {
			console.log(`🔌 Socket failed to connect`);
			throw error;
		}

		// Persist session
		const token = channel.userData['token'];
		localStorage.setItem('token', token);

		this.sessionEntity = new Entity();
		const socket = new Socket(channel);
		this.sessionEntity.add(Session, { id: socket.id, socket });
		this.engine.addEntity(this.sessionEntity);

		console.log(`🔌 Socket connected ${socket.id}`);
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
