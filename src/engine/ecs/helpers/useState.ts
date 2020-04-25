import { System } from '../System';
import { Entity } from '../Entity';

// export type StateComponent = { [index: string]: {} } | {};
export const useState = <TStateComponent>(system: System, state: TStateComponent) => {
	const entity = new Entity();
	entity.add(state);

	system.signalOnAddedToEngine.connect(engine => {
		engine.addEntity(entity);
	});

	return state;
};
