import { CoupleCallbacks, useCouple, useQueries } from '@ecs/ecs/helpers';
import { all, QueryPattern } from '@ecs/ecs/Query';
import { System } from '@ecs/ecs/System';
import Ammo from 'ammojs-typed';
import Collisions from '../../3d/components/Collisions';
import { Optional } from '../../3d/couples/CannonCouple';
import { AmmoState } from '../AmmoPhysicsSystem';
import AmmoBody from '../components/AmmoBody';

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
		return query.ammoState.first.get(AmmoState);
	};

	const couple = useCouple(query.physicsObject, {
		onCreate: entity => {
			const createdPhysicsObject = callbacks.onCreate(entity);
			const world = getAmmoState().world;

			const ammoBody = entity.get(AmmoBody);
			if (!ammoBody) {
				console.log(entity);
				throw 'Missing AmmoBody!';
			}
			ammoBody.body = createdPhysicsObject;

			if(ammoBody.ghost) {
				createdPhysicsObject.setCollisionFlags(4); // CF_NO_CONTACT_RESPONSE
			}

			entity.add(Collisions);

			if (createdPhysicsObject instanceof Ammo.btRigidBody) {
				world.addRigidBody(createdPhysicsObject);
			}

			return createdPhysicsObject;
		},
		onUpdate: (entity, physicsObject, dt) => {
			if (callbacks.onUpdate) {
				if (physicsObject) {
					callbacks.onUpdate(entity, physicsObject, dt);
				} else {
					console.log('No physics object...');
				}
			}
		},
		onLateUpdate: (entity, physicsObject, dt) => {
			entity.get(Collisions).contacts.clear();
		},
		onDestroy: (entity, physicsObject) => {
			// const { world } = getAmmoState();
			// if(physicsObject instanceof Ammo.btRigidBody) {
			//     world.removeRigidBody(physicsObject);
			// }
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
				if((ammoObjectA as any).getCollisionShape() == ammoObjectB.getCollisionShape()) return entity;
			}
		},
	}
};
