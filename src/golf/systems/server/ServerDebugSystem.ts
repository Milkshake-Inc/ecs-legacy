import { useSingletonQuery } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { TickerEngineStatistics } from '@ecs/ecs/TickerEngine';
import { GolfPacketOpcode, useGolfNetworking } from '../../constants/GolfNetworking';
import { useTimer } from '@ecs/ecs/helpers/useTimer';

export default class ServerDebugSystem extends System {
	getEngineStatistics = useSingletonQuery(this, TickerEngineStatistics);
	networking = useGolfNetworking(this);
	timer = useTimer(this, () => this.sendStatistics(), 1000)

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
