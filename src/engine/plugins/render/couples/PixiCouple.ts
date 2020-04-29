import { Entity } from '@ecs/ecs/Entity';
import { CoupleCallbacks, useCouple, useQueries, useEvents } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all, QueryPattern } from '@ecs/utils/QueryHelper';
import { DisplayObject, DisplayObject as PixiDisplayObject } from 'pixi.js';
import RenderState from '../components/RenderState';
import { Interactable } from '../components/Interactable';

export const genericDisplayObjectUpdate = (entity: Entity, displayObject: PixiDisplayObject) => {
	const transform = entity.get(Transform);

	displayObject.position.set(transform.position.x, transform.position.y);
	displayObject.scale.set(transform.scale.x, transform.scale.y);
	displayObject.rotation = transform.rotation.x;
	displayObject.zIndex = transform.position.z;

	const interactable = entity.has(Interactable);
	displayObject.interactive = displayObject.buttonMode = interactable;
};

export type Optional<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const usePixiCouple = <T extends DisplayObject>(
	system: System,
	displayObjectQuery: QueryPattern | QueryPattern[],
	callbacks: Optional<CoupleCallbacks<T>, 'onUpdate' | 'onDestroy'>
) => {
	const query = useQueries(system, {
		renderState: all(RenderState),
		displayObjectQuery
	});

	const events = useEvents(system);

	const getRenderState = () => {
		return query.renderState.first.get(RenderState);
	};

	return useCouple<T>(query.displayObjectQuery, {
		onCreate: entity => {
			const createdDisplayObject = callbacks.onCreate(entity);

			createdDisplayObject.on('click', () => {
				events.dispatchEntity(entity, 'CLICK');
			});

			return getRenderState().container.addChild(createdDisplayObject);
		},
		onUpdate: (entity, displayObject, dt) => {
			genericDisplayObjectUpdate(entity, displayObject);
			if (callbacks.onUpdate) {
				callbacks.onUpdate(entity, displayObject, dt);
			}
		},
		onDestroy: (entity, displayObject) => {
			getRenderState().container.removeChild(displayObject);
		}
	});
};
