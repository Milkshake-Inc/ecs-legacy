import { makeQuery, QueryPattern } from '@ecs/utils/QueryHelper';
import { Entity, EntitySnapshot } from '../Entity';
import { IterativeSystem } from '../IterativeSystem';

export type FunctionalSystemStuff = {
	entityUpdate?(entity: Entity, dt: number): void;
	entityUpdateFixed?(entity: Entity, dt: number): void;
	entityAdded?(entity: Entity): void;
	entityRemoved?(entity: Entity): void;
};

export const functionalSystem = <Q extends QueryPattern[]>(query: Q, callbacks: FunctionalSystemStuff) => {
	const system = class CustomSystem extends IterativeSystem {
		constructor() {
			super(makeQuery(...query));
		}
		updateEntity(entity: Entity, dt: number) {
			if (callbacks.entityUpdate) callbacks.entityUpdate(entity, dt);
		}

		updateEntityFixed(entity: Entity, dt: number) {
			if (callbacks.entityUpdateFixed) callbacks.entityUpdateFixed(entity, dt);
		}

		entityAdded = (snapshot: EntitySnapshot) => {
			if (callbacks.entityAdded) callbacks.entityAdded(snapshot.entity);
		};

		entityRemoved = (snapshot: EntitySnapshot) => {
			if (callbacks.entityRemoved) callbacks.entityRemoved(snapshot.entity);
		};
	};

	return new system();
};
