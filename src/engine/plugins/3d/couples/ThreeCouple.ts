import { Entity } from '@ecs/ecs/Entity';
import { CoupleCallbacks, useCouple, useQueries, useEvents } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Position from '@ecs/plugins/Position';
import { all, QueryPattern } from '@ecs/utils/QueryHelper';
import { Object3D } from 'three';
import RenderState from '../components/RenderState';

export const genericObject3DUpdate = (entity: Entity, object3D: Object3D) => {
	const position = entity.get(Position);

	object3D.position.set(position.x, position.y, position.z);
	object3D.scale.set(position.scale.x, position.scale.y, position.scale.x); // TODO scale on 3 axis
	object3D.rotation.set(object3D.rotation.x, position.r, object3D.rotation.z); // TODO rotate on 3 axis
};

export type Optional<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const useThreeCouple = <T extends Object3D>(
	system: System,
	object3DQuery: QueryPattern | QueryPattern[],
	callbacks: Optional<CoupleCallbacks<T>, 'onUpdate' | 'onDestroy'>
) => {
	const query = useQueries(system, {
		renderState: all(RenderState),
		object3DQuery
	});

	const events = useEvents(system);

	const getRenderState = () => {
		return query.renderState.first.get(RenderState);
	};

	return useCouple<T>(query.object3DQuery, {
		onCreate: entity => {
			const created3DObject = callbacks.onCreate(entity);

			created3DObject.addEventListener('click', () => {
				events.dispatchEntity(entity, 'CLICK');
			});

			getRenderState().scene.add(created3DObject);
			return created3DObject;
		},
		onUpdate: (entity, object3D, dt) => {
			genericObject3DUpdate(entity, object3D);
			if (callbacks.onUpdate) {
				callbacks.onUpdate(entity, object3D, dt);
			}
		},
		onDestroy: (entity, object3D) => {
			getRenderState().scene.remove(object3D);
		}
	});
};
