import { isFunction } from '@ecs/utils/Class';
import { Engine } from '../Engine';
import { Entity } from '../Entity';
import { IterativeSystem } from '../IterativeSystem';
import { Query } from '../Query';

export type Queries = { [index: string]: Query };

export class StatefulIterativeSystem<StateComponent extends { [index: string]: {} } | {}, Q extends Queries = {}> extends IterativeSystem {
	protected state: StateComponent;
	protected queries: Q;

	constructor(query: Query, stateComponent: (() => StateComponent) | StateComponent, queries?: Q) {
		super(query);

		this.queries = queries;
		this.state = isFunction(stateComponent) ? stateComponent() : stateComponent;
	}

	public onAddedToEngine(engine: Engine) {
		engine.addEntity(new Entity().add(this.state));

		if (this.queries) {
			Object.values(this.queries).forEach(query => {
				engine.addQuery(query);
			});
		}

		super.onAddedToEngine(engine);
	}
}

export class QueriesIterativeSystem<Q extends Queries = {}> extends IterativeSystem {
	protected queries: Q;

	constructor(query: Query, queries?: Q) {
		super(query);

		this.queries = queries;
	}

	public onAddedToEngine(engine: Engine) {
		if (this.queries) {
			Object.values(this.queries).forEach(query => {
				engine.addQuery(query);
			});
		}

		super.onAddedToEngine(engine);
	}
}
