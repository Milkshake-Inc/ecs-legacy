import BaseSpace from '../../BaseSpace';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';

export class NetworkClientSpace extends BaseSpace {
	setup() {
		super.setup();

		// this.addSystem(new FreeRoamCameraSystem());
		this.addSystem(new ClientPingSystem());
	}
}
