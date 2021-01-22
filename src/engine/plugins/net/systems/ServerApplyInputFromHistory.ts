import { all, Class, Entity, System } from 'tick-knock';
import { useQueries } from '@ecs/core/helpers';
import Input from '@ecs/plugins/input/components/Input';
import { InputHistory } from '@ecs/plugins/input/components/InputHistory';
import { ServerPingState } from '@ecs/plugins/net/components/ServerPingState';
import Session from '@ecs/plugins/net/components/Session';

export class ServerApplyInputFromHistory extends System {
	protected queries = useQueries(this, {
		serverPing: all(ServerPingState),
		sessionInputHistories: all(Session, Input, InputHistory)
	});

	update(dt: number) {
		this.queries.sessionInputHistories.forEach(entity => {
			const input = entity.get(Input);
			const history = entity.get(InputHistory).inputs;
			const { serverTick } = this.queries.serverPing.first.get(ServerPingState);

			if (history[serverTick]) {
				Object.assign(input, history[serverTick]);
			} else {
				// console.log("Don't have input for this frame :(");
			}
		});
	}
}

export class ServerCustomApplyInputFromHistory<T> extends System {
	protected queries = useQueries(this, {
		serverPing: all(ServerPingState),
		sessionInputHistories: all(Session, Input, InputHistory)
	});

	private inputClass: Class<T>;

	constructor(inputClass: Class<T>) {
		super();
		console.log(`Create${inputClass}`);
		this.inputClass = inputClass;
	}

	update(dt: number) {
		this.queries.sessionInputHistories.forEach(entity => {
			const input = entity.get(this.inputClass);
			const history = entity.get(InputHistory).inputs;
			const { serverTick } = this.queries.serverPing.first.get(ServerPingState);

			if (history[serverTick]) {
				Object.assign(input, history[serverTick]);
			} else {
				// console.log("Don't have input for this frame :(");
			}
		});
	}
}
