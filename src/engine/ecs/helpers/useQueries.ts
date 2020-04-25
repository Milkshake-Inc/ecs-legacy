import { makeQuery, QueryPattern } from '@ecs/utils/QueryHelper';
import { Engine } from '../Engine';
import { Query } from '../Query';
import { System } from '../System';

export type Queries = { [index: string]: Query };

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
