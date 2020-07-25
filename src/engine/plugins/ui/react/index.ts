import { createContext } from 'preact';
import { Engine } from '@ecs/ecs/Engine';
import { useState, useEffect, useContext, EffectCallback, useRef } from 'preact/hooks';
import { functionalSystem } from '@ecs/ecs/helpers';

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

export const attachToEngine = () => {
	const engine = useContext(EngineContext);
	const forceUpdate = useForceUpdate();

	useBeforeMount(() => {
		console.log('creating ui system');
		const system = functionalSystem([], {
			update: dt => {
				forceUpdate();
			}
		});
		engine.addSystem(system);

		// cleanup system
		return () => {
			console.log('removing ui system');
			engine.removeSystem(system);
		};
	});

	return engine;
};

export const useECS = <T>(state?: (engine: Engine) => T) => {
	const [s] = useState(() => {
		const engine = attachToEngine();
		return state ? state(engine) : ({} as T);
	});

	return s;
};
