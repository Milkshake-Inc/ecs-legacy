import { Entity } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Input from '@ecs/plugins/input/components/Input';
import { InputHistory } from '@ecs/plugins/input/components/InputHistory';
import { ServerPingState } from '@ecs/plugins/net/components/ServerPingState';
import Session from '@ecs/plugins/net/components/Session';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { Class } from '@ecs/utils/Class';

export class ServerApplyInputFromHistory extends IterativeSystem {
	protected queries = useQueries(this, {
		serverPing: all(ServerPingState)
	});

	constructor() {
		super(makeQuery(all(Session, Input, InputHistory)));
	}

	updateEntityFixed(entity: Entity, dt: number) {
		const input = entity.get(Input);
		const history = entity.get(InputHistory).inputs;
		const { serverTick } = this.queries.serverPing.first.get(ServerPingState);

		if (history[serverTick]) {
			Object.assign(input, history[serverTick]);
		} else {
			// console.log("Don't have input for this frame :(");
		}
	}
}

export class ServerCustomApplyInputFromHistory<T> extends IterativeSystem {
	protected queries = useQueries(this, {
		serverPing: all(ServerPingState)
	});

	private inputClass: Class<T>;

	constructor(inputClass: Class<T>) {
		super(makeQuery(all(Session, inputClass, InputHistory)));
		console.log(`Create${inputClass}`);
		this.inputClass = inputClass;
	}

	updateEntityFixed(entity: Entity, dt: number) {
		const input = entity.get(this.inputClass);
		const history = entity.get(InputHistory).inputs;
		const { serverTick } = this.queries.serverPing.first.get(ServerPingState);

		if (history[serverTick]) {
			Object.assign(input, history[serverTick]);
		} else {
			// console.log("Don't have input for this frame :(");
		}
	}
}
