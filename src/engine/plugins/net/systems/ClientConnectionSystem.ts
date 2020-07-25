import { Entity } from '@ecs/ecs/Entity';
import { Engine } from '@ecs/ecs/Engine';
import { makeQuery } from '@ecs/ecs/Query';
import Session from '../components/Session';
import geckosClient, { ClientChannel } from '@geckos.io/client';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Socket from '../utils/Socket';
import { useState } from '@ecs/ecs/helpers';

export class ConnectionStatistics {
	public connected = false;
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

		console.log(`🔌 Connecting to server...!`);
		this.connect(); // localStorage.getItem('token'); // <-- persist connections
	}

	protected connect(token = '') {
		const client = geckosClient({
			authorization: token
		});

		client.onConnect(error => this.handleConnection(client, error));
		client.onDisconnect(() => this.handleDisconnection());
	}

	protected handleConnection(channel: ClientChannel, error?: Error) {
		console.log(`🔌 Connected!`);

		if (error) {
			console.log(`🔌 Socket failed to connect`);
			setTimeout(() => this.connect(localStorage.getItem('token')), 1000);
			throw error;
		}

		this.state.connected = true;

		// Persist session
		const token = channel.userData['token'];
		localStorage.setItem('token', token);

		this.sessionEntity = new Entity();
		const socket = new Socket(channel);
		this.sessionEntity.add(Session, { id: socket.id, socket });

		console.log(`🔌 Socket connected ${socket.id}`);

		this.engine.addEntity(this.sessionEntity);
	}

	protected handleDisconnection() {
		this.state.connected = false;
		this.engine.removeEntity(this.sessionEntity);
		this.sessionEntity = null;

		console.log(`🔌 Socket disconnected`);
		console.log(`🔌 Reconnecting...`);
		setTimeout(() => this.connect(localStorage.getItem('token')), 1000);
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
