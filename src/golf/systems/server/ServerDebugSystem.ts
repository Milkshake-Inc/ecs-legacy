import { useSingletonQuery } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { TickerEngineStatistics } from '@ecs/ecs/TickerEngine';
import { GolfPacketOpcode, useGolfNetworking } from '../../constants/GolfNetworking';

export default class ServerDebugSystem extends System {
	getEngineStatistics = useSingletonQuery(this, TickerEngineStatistics);
	networking = useGolfNetworking(this);

	update(deltaTime: number) {
		super.update(deltaTime);

		if (this.getEngineStatistics()) {
			const { frameTime } = this.getEngineStatistics();

			this.networking.send({
				opcode: GolfPacketOpcode.SERVER_DEBUG,
				frameTime
			});
		}
	}
}
