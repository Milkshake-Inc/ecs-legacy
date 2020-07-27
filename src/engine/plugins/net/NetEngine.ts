import '@ecs/plugins/tools/ServerHooks'; // Needed to inject global variables used by some modules on server

import TickerEngine from '@ecs/ecs/TickerEngine';
import geckosServer, { GeckosServer } from '@geckos.io/server';
import ServerConnectionSystem from './systems/ServerConnectionSystem';
import ServerPingSystem from './systems/ServerPingSystem';
import { verify, sign } from 'jsonwebtoken';
import { uuid } from 'uuidv4';

const secret = 'somethingsupersecretyo';

interface JWTData {
	id: string;
}

export class NetEngine extends TickerEngine {
	public server: GeckosServer;
	public connections: ServerConnectionSystem;

	constructor(fps = 60) {
		super(fps);

		this.server = geckosServer({
			authorization: async token => {
				// If token exists, verify it and return as userData for client to get existing user.
				if (token) {
					try {
						const { id } = verify(token, secret) as JWTData;
						return { token, id };
					} catch (e) {
						console.warn(`invalid token ${token}. Generating new one...`);
					}
				}

				// Generate new user
				const id = uuid();
				token = sign({ id: id }, secret, {
					expiresIn: '1 day'
				});
				return { token, id };
			}
		});

		this.addSystem((this.connections = new ServerConnectionSystem(this, this.server)), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ServerPingSystem(this.tickRate));

		this.server.listen();
	}
}
