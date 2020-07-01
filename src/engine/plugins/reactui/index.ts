import { createContext } from 'preact';
import { Engine } from '@ecs/ecs/Engine';
import { QueryPattern } from '@ecs/utils/QueryHelper';
import { useState, useEffect, useContext, EffectCallback, useRef } from 'preact/hooks';
import { functionalSystem } from '@ecs/ecs/helpers';
import { Query } from '@ecs/ecs/Query';

export const EngineContext = createContext(null as Engine);

export const useForceUpdate = () => {
	const [, setState] = useState(0);
	return () => setState(state => ++state);
};

export const useBeforeMount = (callback: EffectCallback) => {
	let cleanup: void | (() => void);

	// call cleanup on unmounting
	useEffect(() => cleanup, []);

	const willMount = useRef(true);

	if (willMount.current) {
		cleanup = callback();
	}

	willMount.current = false;
};

export const useQuery = (...patterns: QueryPattern[]) => {
	// eslint-disable-next-line prefer-const
	let [query, setQuery] = useState(undefined as Query);
	const forceUpdate = useForceUpdate();

	useBeforeMount(() => {
		console.log('creating ui system');
		const engine = useContext(EngineContext);
		const system = functionalSystem(patterns, {
			update: dt => {
				forceUpdate();
			}
		});
		engine.addSystem(system);

		// Set query and cache it
		query = system.query;
		setQuery(system.query);

		// cleanup system
		return () => {
			console.log('removing ui system');
			engine.removeSystem(system);
		};
	});

	return query;
};
