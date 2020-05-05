import { makeQuery, QueryPattern } from '@ecs/utils/QueryHelper';
import { Entity, EntitySnapshot } from '../Entity';
import { IterativeSystem } from '../IterativeSystem';
import { System } from '../System';
import { useQueries, ToQueries } from './useQueries';

export type FunctionalSystemStuff = {
	update?: (dt: number) => void;
	updateFixed?: (dt: number) => void;
	entityUpdate?: (entity: Entity, dt: number) => void;
	entityUpdateFixed?: (entity: Entity, dt: number) => void;
	entityAdded?: (entity: Entity) => void;
	entityRemoved?: (entity: Entity) => void;
};

export const functionalSystem = <Q extends QueryPattern[]>(query: Q, callbacks: FunctionalSystemStuff) => {
	const system = class CustomSystem extends IterativeSystem {
		constructor() {
			super(makeQuery(...query));
		}
		update(dt: number) {
			super.update(dt);
			if (callbacks.update) callbacks.update(dt);
		}

		updateFixed(dt: number) {
			super.updateFixed(dt);
			if (callbacks.update) callbacks.updateFixed(dt);
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

export type FunctionalSystemQueryStuff<Q> = {
	update?(queries: Q, dt: number): void;
	updateFixed?(queries: Q, dt: number): void;
};

export const functionalSystemQuery = <Q extends { [index: string]: QueryPattern | QueryPattern[] }>(
	queries: Q,
	callbacks: FunctionalSystemQueryStuff<ToQueries<Q>>
) => {
	const system = class CustomSystem extends System {
		protected queries = useQueries(this, queries);

		constructor() {
			super();
		}

		update(deltaTime: number) {
			if (callbacks.update) {
				callbacks.update(this.queries, deltaTime);
			}
		}

		updateFixed(deltaTime: number) {
			if (callbacks.updateFixed) {
				callbacks.updateFixed(this.queries, deltaTime);
			}
		}
	};

	return new system();
};
