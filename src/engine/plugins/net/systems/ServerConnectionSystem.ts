import { Engine } from '../../../core/Engine';
import { Entity } from '../../../core/Entity';
import { useSimpleEvents } from '../../../core/helpers';
import { sign, verify } from 'jsonwebtoken';
import { uuid } from 'uuidv4';
import { Packet } from '../components/Packet';
import { System } from '../../../core/System';
import { NetEvents } from '../components/NetEvents';

const secret = 'somethingsupersecretyo';

interface JWTData {
	id: string;
}

export default abstract class ServerConnectionSystem extends System {
	protected engine: Engine;
	protected events = useSimpleEvents();

	constructor(engine: Engine) {
		super();

		this.engine = engine;

		this.events = useSimpleEvents();
		this.events.on(NetEvents.Disconnect, this.disconnect.bind(this));
		this.events.on(NetEvents.Send, this.send.bind(this));
		this.events.on(NetEvents.SendTo, this.sendTo.bind(this));
		this.events.on(NetEvents.SendExcept, this.sendExcept.bind(this));

		console.log(`🔌 Server started!`);
	}

	protected async authorization(token: string) {
		console.log('auth');

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

	public abstract sendTo(entity: Entity, packet: Packet, reliable: boolean): void;

	public abstract send(packet: Packet, reliable: boolean): void;

	public abstract sendExcept(exceptEntity: Entity, packet: Packet, reliable: boolean): void;

	public abstract disconnect(entity: Entity): void;
}
