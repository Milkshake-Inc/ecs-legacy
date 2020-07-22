import { makeQuery, QueryPattern, all } from '@ecs/ecs/Query';
import { Engine } from '../Engine';
import { Query } from '../Query';
import { System } from '../System';
import { Class } from '@ecs/ecs/Class';

export type Queries = { [index: string]: Query };

export type ToQueries<T> = {
	[P in keyof T]?: Query;
};

export const useQueries = <Q extends { [index: string]: QueryPattern | QueryPattern[] }>(
	systemOrEngine: System | Engine,
	queries?: Q
): ToQueries<Q> => {
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

	if (systemOrEngine instanceof System) {
		systemOrEngine.signalOnAddedToEngine.connect(onAddedCallback);
		systemOrEngine.signalOnRemovedFromEngine.disconnect(onAddedCallback);
	} else {
		onAddedCallback(systemOrEngine);
	}

	return queriesObject;
};

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

export const useSingletonQuery = <T>(system, component: Class<T>) => {
	const queries = useQueries(system, { singleton: all(component) });

	return () => queries.singleton.first.get(component);
};
