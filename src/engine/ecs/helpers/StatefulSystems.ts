import { Class } from '@ecs/utils/Class';
import { all, makeQuery, QueryPattern } from '@ecs/utils/QueryHelper';
import { Engine } from '../Engine';
import { Entity, EntitySnapshot } from '../Entity';
import { IterativeSystem } from '../IterativeSystem';
import { Query } from '../Query';
import { System } from '../System';

export type Queries = { [index: string]: Query };

export type StateComponent = { [index: string]: {} } | {};

export const useState = <TStateComponent>(system: System, state: TStateComponent) => {
	const entity = new Entity();
	entity.add(state);

	system.signalOnAddedToEngine.connect(engine => {
		engine.addEntity(entity);
	});

	return state;
};

export const getState = <T>(state: Class<T>) => makeQuery(all(state));

export const useQueriesManual = <Q extends Queries = {}>(system: System, queries?: Q) => {
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

export type ToQueries<T> = {
	[P in keyof T]?: Query;
};

export const useQueries = <Q extends { [index: string]: QueryPattern | QueryPattern[] }>(system: System, queries?: Q): ToQueries<Q> => {
	const queriesObject = {};

	if (queries) {
		Object.keys(queries).forEach(key => {
			const queryPattern = queries[key];
			const asArray = queryPattern instanceof Array ? queryPattern : [queryPattern];
			const query = makeQuery(...asArray);

			queriesObject[key] = query;
		});
	}

	const onAddedCallback = (engine: Engine) => {
		Object.values(queriesObject).forEach((query: Query) => engine.addQuery(query));
	};

	system.signalOnAddedToEngine.connect(onAddedCallback);
	system.signalOnRemovedFromEngine.disconnect(onAddedCallback);

	return queriesObject;
};

type FunctionalSystemStuff = {
	entityUpdate?(entity: Entity, dt: number): void;
	entityUpdateFixed?(entity: Entity, dt: number): void;
	entityAdded?(entity: Entity): void;
	entityRemoved?(entity: Entity): void;
};

export const functionalSystem = <Q extends QueryPattern[]>(query: Q, callbacks: FunctionalSystemStuff) => {
	const system = class CustomSystem extends IterativeSystem {
		constructor() {
			super(makeQuery(...query));
		}
		updateEntity(entity: Entity, dt: number) {
			if (callbacks.entityUpdate) callbacks.entityUpdate(entity, dt);
		}

		updateEntityFixed(entity: Entity, dt: number) {
			if (callbacks.entityUpdateFixed) callbacks.entityUpdateFixed(entity, dt);
		}

		entityAdded = (snapshot: EntitySnapshot) => {
			if (callbacks.entityAdded) callbacks.entityAdded(snapshot.entity);
		};

		entityRemoved = (snapshot: EntitySnapshot) => {
			if (callbacks.entityRemoved) callbacks.entityRemoved(snapshot.entity);
		};
	};

	return new system();
};

export class Events {
	public events: { type: string; data?: any }[] = [];
}

export const useEvents = <TEvents extends { [index: string]: () => void }>(system: System, eventCallbacks?: TEvents) => {
	const entityEventsToClear: Entity[] = [];

	const queuedEvents: (() => void)[] = [];

	const queries = useQueries(system, {
		events: all(Events)
	});

	const state = useState(system, new Events());

	system.signalPreUpdate.connect(() => {
		state.events = [];

		entityEventsToClear.forEach(entity => entity.remove(Events));

		// Trigger callbacks on events listened to
		queries.events.forEach(entity => {
			const entityEvents = entity.get(Events);
			for (const event of entityEvents.events) {
				if (eventCallbacks && eventCallbacks[event.type]) {
					eventCallbacks[event.type]();
				}
			}
		});

		queuedEvents.forEach((entity, index) => {
			queuedEvents.splice(index, 1);
			entity();
		});
	});

	return {
		dispatchGlobal: (type: string) => {
			state.events.push({ type: type });
		},
		dispatchEntity: (entity: Entity, type: string) => {
			queuedEvents.push(() => {
				if (!entity.has(Events)) {
					entity.add(Events);
				}

				const { events } = entity.get(Events);
				events.push({ type });
				entityEventsToClear.push(entity);
			});
		}
	};
};

export type CoupleCallbacks<T> = {
	onCreate: (entity: Entity) => T;
	onUpdate?: (entity: Entity, coupleType: T, deltaTime: number) => void;
	onDestroy: (entity: Entity, coupleType: T) => void;
};

export const useCouple = <T>(query: Query, callbacks: CoupleCallbacks<T>) => {
	const map: Map<Entity, T> = new Map();

	const onCreate = ({ entity }: EntitySnapshot) => {
		const coupleType = callbacks.onCreate(entity);
		map.set(entity, coupleType);

		callbacks.onUpdate(entity, coupleType, 0);
	};

	const onDestroy = ({ entity }: EntitySnapshot) => {
		callbacks.onDestroy(entity, map.get(entity));
		map.delete(entity);
	};

	query.onEntityAdded.connect(onCreate);
	query.onEntityRemoved.connect(onDestroy);

	return {
		update: (deltaTime: number) => {
			if (callbacks.onUpdate) {
				query.entities.forEach(entity => {
					callbacks.onUpdate(entity, map.get(entity), deltaTime);
				});
			}
		}
	};
};
