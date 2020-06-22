import { all } from '@ecs/utils/QueryHelper';
import { Entity } from '../Entity';
import { System } from '../System';
import { useQueries } from './useQueries';
import { useState } from './useState';
import { EventEmitter } from 'events';

const EVENT_BUS = new EventEmitter();

export const useSimpleEvents = () => EVENT_BUS;

export class Events {
	public events: { type: string; data?: any }[] = [];
}

// Should this be split into useEvents & useEventsGlobal?
export const useEvents = <TEvents extends { [index: string]: (data: any) => void }>(system: System, eventCallbacks?: TEvents) => {
	const entityEventsToClear: Entity[] = [];

	const queuedEvents: (() => void)[] = [];

	const queries = useQueries(system, {
		events: all(Events)
	});

	const state = useState(system, new Events());

	system.signalBeforeUpdate.connect(() => {
		// Clear all global events
		state.events = [];
		entityEventsToClear.forEach(entity => entity.remove(Events));

		// Trigger callbacks on events listened to
		queries.events.forEach(entity => {
			const entityEvents = entity.get(Events);
			for (const event of entityEvents.events) {
				if (eventCallbacks && eventCallbacks[event.type]) {
					eventCallbacks[event.type](event.data);
				}
			}
		});

		queuedEvents.forEach((entity, index) => {
			queuedEvents.splice(index, 1);
			entity();
		});
	});

	return {
		dispatchGlobal: (type: string, data?: any) => {
			state.events.push({ type, data });
		},
		dispatchEntity: (entity: Entity, type: string) => {
			// We queue up event so is dispatched next update
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
