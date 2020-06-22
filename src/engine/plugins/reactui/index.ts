import { createContext } from 'preact';
import { Engine } from '@ecs/ecs/Engine';
import { QueryPattern, makeQuery } from '@ecs/utils/QueryHelper';
import { useState, useEffect, useContext } from 'preact/hooks';
import { functionalSystem } from '@ecs/ecs/helpers';

export const EngineContext = createContext(null as Engine);

export function useQuery(...patterns: QueryPattern[]) {
	const [query, setQuery] = useState(makeQuery());

	useEffect(() => {
		const engine = useContext(EngineContext);
		const system = functionalSystem(patterns, {
			update: dt => {
				// Call setQuery to force re-render on each update
				setQuery(system.query);
			}
		});
		engine.addSystem(system);

		// cleanup system
		return () => {
			engine.removeSystem(system);
		};
	});

	return query;
}
