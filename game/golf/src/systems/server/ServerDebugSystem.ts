import { useSingletonQuery } from '@ecs/core/helpers';
import { System } from '@ecs/core/System';
import { TickerEngineStatistics } from '@ecs/core/TickerEngine';
import { GolfPacketOpcode, useGolfNetworking } from '../../constants/GolfNetworking';
import { useTimer } from '@ecs/core/helpers/useTimer';

export default class ServerDebugSystem extends System {
	getEngineStatistics = useSingletonQuery(this, TickerEngineStatistics);
	networking = useGolfNetworking(this);
	timer = useTimer(this, () => this.sendStatistics(), 1000);

	sendStatistics() {
		if (this.getEngineStatistics()) {
			const { frameTime } = this.getEngineStatistics();
			this.networking.send({
				opcode: GolfPacketOpcode.SERVER_DEBUG,
				frameTime
			});
		}
	}
}
