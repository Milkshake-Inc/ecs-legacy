import { Entity, EntitySnapshot, Query } from 'tick-knock';

export type CoupleCallbacks<T> = {
	onCreate: (entity: Entity) => T;
	onUpdate?: (entity: Entity, coupleType: T, deltaTime: number, frameDelta?: number) => void;
	onLateUpdate?: (entity: Entity, coupleType: T, deltaTime: number) => void;
	onDestroy: (entity: Entity, coupleType: T) => void;
};

export const useCouple = <T>(query: Query, callbacks: CoupleCallbacks<T>) => {
	const map: Map<Entity, T> = new Map();

	const onCreate = ({ entity }: EntitySnapshot) => {
		const coupleType = callbacks.onCreate(entity);
		map.set(entity, coupleType);

		callbacks.onUpdate(entity, coupleType, 0);
	};

	const onDestroy = ({ entity }: EntitySnapshot) => {
		callbacks.onDestroy(entity, map.get(entity));
		map.delete(entity);
	};

	query.onEntityAdded.connect(onCreate);
	query.onEntityRemoved.connect(onDestroy);

	return {
		entities: map,
		update: (deltaTime: number, frameDelta?: number) => {
			if (callbacks.onUpdate) {
				query.entities.forEach(entity => {
					callbacks.onUpdate(entity, map.get(entity), deltaTime, frameDelta);
				});
			}
		},
		lateUpdate: (deltaTime: number) => {
			if (callbacks.onLateUpdate) {
				query.entities.forEach(entity => {
					callbacks.onLateUpdate(entity, map.get(entity), deltaTime);
				});
			}
		}
	};
};
