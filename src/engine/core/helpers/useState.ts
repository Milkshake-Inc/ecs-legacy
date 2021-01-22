import { System, Entity, Engine } from 'tick-knock';

export const useState = <TStateComponent>(
	systemOrEngine: System | Engine,
	state: NonNullable<TStateComponent>,
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
