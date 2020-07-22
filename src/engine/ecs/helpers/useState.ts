import { System } from '../System';
import { Entity } from '../Entity';
import { Engine } from '../Engine';

// export type StateComponent = { [index: string]: {} } | {};
export const useState = <TStateComponent>(
	systemOrEngine: System | Engine,
	state: TStateComponent,
	defaultState?: Partial<TStateComponent>
) => {
	const entity = new Entity();
	entity.add(state);

	if (defaultState) {
		Object.assign(state, defaultState);
	}

	if (systemOrEngine instanceof System) {
		systemOrEngine.signalOnAddedToEngine.connect(engine => {
			engine.addEntity(entity);
		});
	} else {
		systemOrEngine.addEntity(entity);
	}

	return state;
};
