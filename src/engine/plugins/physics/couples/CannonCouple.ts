import { CoupleCallbacks, useCouple, useQueries, useEvents } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { all, QueryPattern } from '@ecs/utils/QueryHelper';
import { Body, Shape, Constraint, ContactMaterial, Material } from 'cannon';
import PhysicsState from '../components/PhysicsState';

export type Optional<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const useCannonCouple = <T extends Body | Shape | Shape[] | Constraint | ContactMaterial | Material>(
	system: System,
	physicsObject: QueryPattern | QueryPattern[],
	callbacks: Optional<CoupleCallbacks<T>, 'onUpdate' | 'onDestroy'>
) => {
	const query = useQueries(system, {
		physicsState: all(PhysicsState),
		physicsObject
	});

	const events = useEvents(system);

	const getPhysicsState = () => {
		return query.physicsState.first.get(PhysicsState);
	};

	return useCouple<T>(query.physicsObject, {
		onCreate: entity => {
			const createdPhysicsObject = callbacks.onCreate(entity);

			if (createdPhysicsObject instanceof Body) {
				getPhysicsState().world.addBody(createdPhysicsObject);
				// createdPhysicsObject.addEventListener('collide', () => {
				// 	events.dispatchEntity(entity, 'COLLIDE');
				// });
			}

			if (createdPhysicsObject instanceof Constraint) {
				getPhysicsState().world.addConstraint(createdPhysicsObject);
			}

			if (createdPhysicsObject instanceof ContactMaterial) {
				getPhysicsState().world.addContactMaterial(createdPhysicsObject);
			}

			if (createdPhysicsObject instanceof Material) {
				getPhysicsState().world.addMaterial(createdPhysicsObject);
			}

			return createdPhysicsObject;
		},
		onUpdate: (entity, physicsObject, dt) => {
			if (callbacks.onUpdate) {
				callbacks.onUpdate(entity, physicsObject, dt);
			}
		},
		onDestroy: (entity, physicsObject) => {
			if (physicsObject instanceof Body) {
				getPhysicsState().world.remove(physicsObject);
			}
		}
	});
};
