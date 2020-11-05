import { Engine } from '@ecs/core/Engine';
import { System } from '@ecs/core/System';

export const useEngine = (systemOrEngine: System | Engine) => {
	let engineInstance: Engine = undefined;

	if (systemOrEngine instanceof System) {
		systemOrEngine.signalOnAddedToEngine.connect(engine => {
			engineInstance = engine;
		});
	} else {
		engineInstance = systemOrEngine;
	}

	return () => engineInstance;
};
