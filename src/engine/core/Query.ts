import { getComponentId } from './ComponentId';
import { Entity, EntitySnapshot } from './Entity';
import { Signal } from 'typed-signals';
import { Class } from './Class';
import { Events } from './helpers';

/**
 * Query represents list of entities that matches query request.
 * @see QueryBuilder
 */
export class Query implements Iterable<Entity> {

	*[Symbol.iterator](): Iterator<Entity> {
        for (const entity of this.entities) {
            yield entity;
        }
	}

	/**
	 * Signal dispatches if new matched entity were added
	 */
	public onEntityAdded: Signal<(entity: EntitySnapshot) => void> = new Signal();
	/**
	 * Signal dispatches if entity stops matching query
	 */
	public onEntityRemoved: Signal<(entity: EntitySnapshot) => void> = new Signal();

	private readonly _snapshot: EntitySnapshot = new EntitySnapshot();

	private readonly _predicate: (entity: Entity) => boolean;
	private _entities: Map<number, Entity> = new Map();

	/**
	 * Initializes Query instance
	 * @param predicate Matching predicate
	 */
	public constructor(predicate: (entity: Entity) => boolean) {
		this._predicate = predicate;
	}

	/**
	 * Entities list which matches the query
	 */
	public get entities(): ReadonlyArray<Entity> {
		return Array.from(this._entities.values());
	}

	public get first(): Entity | undefined {
		for (const [, entity] of this._entities) {
			return entity;
		}

		return undefined;
	}

	public get last(): Entity | undefined {
		if (this._entities.size === 0) return undefined;
		return this.entities[this._entities.size - 1];
	}

	public get length(): number {
		return this._entities.size;
	}

	public countBy(predicate: (entity: Entity) => boolean): number {
		let result = 0;
		for (const [, entity] of this._entities) {
			if (predicate(entity)) result++;
		}
		return result;
	}

	public firstBy(predicate: (entity: Entity) => boolean): Entity | undefined {
		for (const [, entity] of this._entities) {
			if (predicate(entity)) return entity;
		}
		return undefined;
	}

	public filter(predicate: (entity: Entity) => boolean): Entity[] {
		return this.entities.filter(predicate);
	}

	public find(predicate: (entity: Entity) => boolean): Entity {
		return this.entities.find(predicate);
	}

	public forEach(predicate: (value: Entity, index: number, array: Entity[]) => void): void {
		this.entities.forEach(predicate);
	}

	public map<T>(predicate: (entity: Entity) => T): T[] {
		return this.entities.map(predicate);
	}

	/**
	 * Match list entities with query
	 */
	public matchEntities(entities: ReadonlyArray<Entity>) {
		entities.forEach(entity => this.entityAdded(entity));
	}

	/**
	 * Gets a value indicating that query is empty
	 */
	public get isEmpty(): boolean {
		return this._entities.size == 0;
	}

	public clear(): void {
		this._entities.clear();
	}

	public validateEntity(entity: Entity): void {
		const queryEntity = this._entities.get(entity.id);
		const isMatch = this._predicate(entity);
		if (queryEntity && !isMatch) {
			this.entityRemoved(entity);
		} else if (!queryEntity && isMatch) {
			this.entityAdded(entity);
		}
	}

	public entityAdded = (entity: Entity) => {
		const queryEntity = this._entities.get(entity.id);
		if (!queryEntity && this._predicate(entity)) {
			this._entities.set(entity.id, entity);
			this._snapshot.takeSnapshot(entity);
			this.onEntityAdded.emit(this._snapshot);
		}
	};

	public entityRemoved = (entity: Entity) => {
		const queryEntity = this._entities.get(entity.id);
		if (queryEntity) {
			this._entities.delete(entity.id);
			this._snapshot.takeSnapshot(entity);
			this.onEntityRemoved.emit(this._snapshot);
		}
	};

	public entityComponentAdded = (entity: Entity, component: any) => {
		const queryEntity = this._entities.get(entity.id);
		const isMatch = this._predicate(entity);
		if (!queryEntity && isMatch) {
			this._snapshot.takeSnapshot(entity, component);
			this._entities.set(entity.id, entity);
			this.onEntityAdded.emit(this._snapshot);
		} else if (queryEntity && !isMatch) {
			this._snapshot.takeSnapshot(entity, component);
			this._entities.delete(entity.id);
			this.onEntityRemoved.emit(this._snapshot);
		}
	};

	public entityComponentRemoved = (entity: Entity, component: any) => {
		const queryEntity = this._entities.get(entity.id);
		if (queryEntity && !this._predicate(entity)) {
			this._snapshot.takeSnapshot(entity, component);
			this._entities.delete(entity.id);
			this.onEntityRemoved.emit(this._snapshot);
		} else if (!queryEntity && this._predicate(entity)) {
			this._snapshot.takeSnapshot(entity, component);
			this._entities.set(entity.id, entity);
			this.onEntityAdded.emit(this._snapshot);
		}
	};
}

function hasAll(entity: Entity, components: number[]): boolean {
	for (const componentId of components) {
		if (entity.components.get(componentId) === undefined) {
			return false;
		}
	}
	return true;
}

/**
 * Query builder, helps to create queries
 * @example
 * const query = new QueryBuilder()
 *  .contains(Position)
 *  .contains(Acceleration)
 *  .contains(TorqueForce)
 *  .build();
 */
export class QueryBuilder {
	private readonly _components: number[] = [];

	/**
	 * Specifies components that must be added to entity to be matched
	 * @param components List of component classes
	 */
	public contains(...components: Class<any>[]): QueryBuilder {
		for (const component of components) {
			const componentId = getComponentId(component, true)!;
			if (this._components.indexOf(componentId) === -1) {
				this._components[this._components.length] = componentId;
			}
		}
		return this;
	}

	/**
	 * Build query
	 */
	public build(): Query {
		return new Query((entity: Entity) => hasAll(entity, this._components));
	}
}

export type QueryPattern = (entity: Entity) => boolean;

export const event = (eventType: string): QueryPattern => {
	return (entity: Entity) => {
		if (entity.has(Events)) {
			const { events } = entity.get(Events);
			for (const event of events) {
				if (event.type == eventType) return true;
			}
		}

		return false;
	};
};

export const all = (...components: Class<any>[]): QueryPattern => {
	return (entity: Entity) => {
		for (const component of components) {
			if (!entity.has(component)) {
				return false;
			}
		}

		return true;
	};
};

export const any = (...components: Class<any>[]): QueryPattern => {
	return (entity: Entity) => {
		for (const component of components) {
			if (entity.has(component)) {
				return true;
			}
		}

		return false;
	};
};

export const not = (...components: Class<any>[]): QueryPattern => {
	return (entity: Entity) => {
		for (const component of components) {
			if (entity.has(component)) {
				return false;
			}
		}

		return true;
	};
};

export const makeQuery = (...patterns: QueryPattern[]) => {
	return new Query(entity => {
		for (const pattern of patterns) {
			if (!pattern(entity)) return false;
		}

		return true;
	});
};
