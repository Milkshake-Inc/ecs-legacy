import { Entity, System, all, QueryPattern } from 'tick-knock';
import { CoupleCallbacks, useCouple, useQueries, useEvents } from '@ecs/core/helpers';
import Transform from '@ecs/plugins/math/Transform';
import { DisplayObject, DisplayObject as PixiDisplayObject } from 'pixi.js';
import PixiRenderState from '../components/RenderState';
import { Interactable } from '../components/Interactable';
import UIDisplayObject from '../components/UIDisplayObject';

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

export enum PixiEvents {
	Clicked = 'clicked'
}

export const usePixiCouple = <T extends DisplayObject>(
	system: System,
	displayObjectQuery: QueryPattern | QueryPattern[],
	callbacks: Optional<CoupleCallbacks<T>, 'onUpdate' | 'onDestroy'>
) => {
	const query = useQueries(system, {
		renderState: all(PixiRenderState),
		displayObjectQuery
	});

	const events = useEvents();

	const getRenderState = () => {
		return query.renderState.first.get(PixiRenderState);
	};

	return useCouple<T>(query.displayObjectQuery, {
		onCreate: entity => {
			const createdDisplayObject = callbacks.onCreate(entity);

			createdDisplayObject.on('click', e => {
				e.stopPropagation();
				events.emit(PixiEvents.Clicked, entity);
			});

			const { container, ui } = getRenderState();

			const parent = entity.has(UIDisplayObject) ? ui : container;

			return parent.addChild(createdDisplayObject);
		},
		onUpdate: (entity, displayObject, dt) => {
			genericDisplayObjectUpdate(entity, displayObject);
			if (callbacks.onUpdate) {
				callbacks.onUpdate(entity, displayObject, dt);
			}
		},
		onDestroy: (entity, displayObject) => {
			displayObject.parent.removeChild(displayObject);
		}
	});
};
