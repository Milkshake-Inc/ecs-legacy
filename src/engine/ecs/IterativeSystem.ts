import { Query } from './Query';
import { Engine } from './Engine';
import { Entity } from './Entity';
import { ReactionSystem } from './ReactionSystem';

/**
 * Represents system that each update iterates over entities from provided query via updateEntity method
 * @example
 * class ViewSystem extends IterativeSystem {
 *   ...
 *   constructor(container:Container) {
 *      this.container = container;
 *   }
 *
 *   // Update entity view position on screen, via position component data
 *   updateEntity(entity:Entity) {
 *     const view = entity.get(View);
 *     const {x, y) = entity.get(Position);
 *     view.x = x;
 *     view.y = y;
 *   }
 *
 *   // Add entity view from screen
 *   entityAdded = (entity:EntitySnapshot) => {
 *    this.container.add(entity.get(View)!.view);
 *   }
 *
 *   // Remove entity view from screen
 *   entityRemoved = (entity:EntitySnapshot) => {
 *    this.container.remove(entity.get(View)!.view);
 *   }
 * }
 */
export abstract class IterativeSystem extends ReactionSystem {
	private _removed = false;

	protected constructor(query: Query) {
		super(query);
	}

	public update(dt: number) {
		this.updateEntities(dt);
	}

	public updateLate(dt: number) {
		this.updateEntitiesLate(dt);
	}

	public updateRender(dt: number) {
		this.updateEntitiesRender(dt);
	}

	public updateFixed(dt: number, frameDt: number) {
		this.updateEntitiesFixed(dt, frameDt);
	}

	public onRemovedFromEngine(engine: Engine) {
		this._removed = true;
		super.onRemovedFromEngine(engine);
	}

	protected updateEntities(dt: number) {
		for (const entity of this.query.entities) {
			if (this._removed) return;
			this.updateEntity(entity, dt);
		}
	}

	protected updateEntitiesLate(dt: number) {
		for (const entity of this.query.entities) {
			if (this._removed) return;
			this.updateEntityLate(entity, dt);
		}
	}

	protected updateEntitiesRender(dt: number) {
		for (const entity of this.query.entities) {
			if (this._removed) return;
			this.updateEntityRender(entity, dt);
		}
	}

	protected updateEntitiesFixed(dt: number, frameDt: number) {
		for (const entity of this.query.entities) {
			if (this._removed) return;
			this.updateEntityFixed(entity, dt, frameDt);
		}
	}

	/**
	 * Update entity
	 *
	 * @param entity Entity to update
	 * @param dt Delta time in seconds
	 */
	protected updateEntity(entity: Entity, dt: number): void {}

	/**
	 * Update entity
	 *
	 * @param entity Entity to update
	 * @param dt Delta time in seconds
	 */
	protected updateEntityLate(entity: Entity, dt: number): void {}

	/**
	 * Update entity
	 *
	 * @param entity Entity to update
	 * @param dt Delta time in seconds
	 */
	protected updateEntityRender(entity: Entity, dt: number): void {}

	/**
	 * Update Fixed entity
	 *
	 * @param entity Entity to update
	 * @param dt Delta time in seconds
	 * @param frameDt Fixed Delta time in seconds
	 */
	protected updateEntityFixed(entity: Entity, dt: number, frameDt: number): void {}
}
