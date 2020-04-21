import { isFunction, Class } from '@ecs/utils/Class';
import { Engine } from '../Engine';
import { Entity } from '../Entity';
import { IterativeSystem } from '../IterativeSystem';
import { Query } from '../Query';
import { System } from '../System';
import { makeQuery, all, QueryPattern } from '@ecs/utils/QueryHelper';

export type Queries = { [index: string]: Query };

export type StateComponent = { [index: string]: {} } | {};

export const useState = <TStateComponent>(system: System, state: TStateComponent) => {
	const entity = new Entity();
	entity.add(state);

	system.signalOnAddedToEngine.connect(engine => {
		engine.addEntity(entity);
	});

	return { state, entity };
};

export const getState = <T>(state: Class<T>) => makeQuery(all(state));

export const useQueries = <Q extends Queries = {}>(system: System, queries?: Q) => {
	const onAddedCallback = (engine: Engine) => {
		if (queries) {
			Object.values(queries).forEach(query => {
				engine.addQuery(query);
			});
		}
	};

	system.signalOnAddedToEngine.connect(onAddedCallback);
	system.signalOnRemovedFromEngine.disconnect(onAddedCallback);

	return queries;
};

type Queryfy<T> = {
	[P in keyof T]?: Query;
};

export const useQueriesFancy = <Q extends { [index: string]: QueryPattern | QueryPattern[] }>(system: System, queries?: Q): Queryfy<Q> => {
	const outObject = {};

	const onAddedCallback = (engine: Engine) => {
		if (queries) {
			Object.keys(queries).forEach(key => {
				const queryPattern = queries[key];
				const asArray = queryPattern instanceof Array ? queryPattern : [queryPattern];
				const query = makeQuery(...asArray);

				outObject[key] = query;

				engine.addQuery(query);
			});
		}
	};

	system.signalOnAddedToEngine.connect(onAddedCallback);
	system.signalOnRemovedFromEngine.disconnect(onAddedCallback);

	return outObject;
};

export class StatefulIterativeSystem<StateComponent extends { [index: string]: {} } | {}, Q extends Queries = {}> extends IterativeSystem {
	protected state: StateComponent;
	protected stateEntity: Entity;

	protected queries: Q;

	constructor(query: Query, stateComponent: (() => StateComponent) | StateComponent, queries?: Q) {
		super(query);

		this.queries = queries;
		this.state = isFunction(stateComponent) ? stateComponent() : stateComponent;
	}

	public onAddedToEngine(engine: Engine) {
		this.stateEntity = new Entity();
		this.stateEntity.add(this.state);
		engine.addEntity(this.stateEntity);

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

export class QueriesSystem<Q extends Queries = {}> extends System {
	protected queries: Q;

	constructor(queries?: Q) {
		super();

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
