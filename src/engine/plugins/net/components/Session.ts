import { ServerChannel } from '@geckos.io/server';
import { ClientChannel } from '@geckos.io/client';
import { Packet } from './Packet';

export default class Session {
	constructor(
		public id: string,
		public socket: ServerChannel | ClientChannel,
		public incoming: Packet[] = [],
		public outgoing: Packet[] = []
	) {}
}
