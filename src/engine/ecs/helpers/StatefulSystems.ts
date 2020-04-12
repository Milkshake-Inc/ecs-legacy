import { isFunction } from '@ecs/utils/Class';
import { Engine } from '../Engine';
import { Entity } from '../Entity';
import { IterativeSystem } from '../IterativeSystem';
import { Query } from '../Query';

export class StatefulIterativeSystem<
	StateComponent extends { [index: string]: {} } | {},
	Queries extends { [index: string]: Query } = {}
> extends IterativeSystem {
	protected state: StateComponent;
	protected queries: Queries;

	constructor(query: Query, stateComponent: (() => StateComponent) | StateComponent, queries?: Queries) {
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
