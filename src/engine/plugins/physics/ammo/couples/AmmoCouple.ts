import { CoupleCallbacks, useCouple, useQueries } from '@ecs/core/helpers';
import { all, QueryPattern } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Ammo from 'ammojs-typed';
import Collisions from '../../3d/components/Collisions';
import { Optional } from '../../3d/couples/CannonCouple';
import { AmmoState } from '../AmmoPhysicsSystem';

// TODO: Maybe have useAmmoShapeCouple - For shared code between AmmoShapeCouple & AmmoTrimeshCouple
export const useAmmoCouple = (
	system: System,
	physicsObject: QueryPattern | QueryPattern[],
	callbacks: Optional<CoupleCallbacks<any>, 'onUpdate' | 'onDestroy'>
) => {
	const query = useQueries(system, {
		ammoState: all(AmmoState),
		physicsObject
	});

	const getAmmoState = () => {
		return query.ammoState.first?.get(AmmoState);
	};

	const couple = useCouple(query.physicsObject, {
		onCreate: entity => {
			const createdPhysicsObject = callbacks.onCreate(entity);
			const world = getAmmoState().world;

			if (createdPhysicsObject instanceof Ammo.btRigidBody) {
				world.addRigidBody(createdPhysicsObject);
			}

			return createdPhysicsObject;
		},
		onUpdate: (entity, physicsObject, dt) => {
			if (callbacks.onUpdate) {
				if (physicsObject) {
					callbacks.onUpdate(entity, physicsObject, dt);
				}
			}
		},
		onLateUpdate: (entity, physicsObject, dt) => {
			entity.get(Collisions).contacts.clear();
		},
		onDestroy: (entity, physicsObject) => {
			if (!getAmmoState()) return;
			const { world } = getAmmoState();
			if (physicsObject instanceof Ammo.btRigidBody) {
				world.removeRigidBody(physicsObject);
			}
		}
	});

	return {
		...couple,
		getEntity: (ammoObjectA: Ammo.btCollisionObject) => {
			for (const [entity] of couple.entities) {
				const ammoObjectB: any = couple.entities.get(entity);

				// TODO
				// Maybe a cheaper way of doing this?
				// And with types
				if ((ammoObjectA as any).getCollisionShape() == ammoObjectB.getCollisionShape()) return entity;
			}
		}
	};
};