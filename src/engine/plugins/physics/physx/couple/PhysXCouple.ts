import { CoupleCallbacks, useCouple, useQueries } from '@ecs/core/helpers';
import { all, QueryPattern } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import { Optional } from '@ecs/plugins/render/3d/couples/ThreeCouple';
import { PhysXState } from './../PhysXPhysicsSystem';

export const usePhysXCouple = (
	system: System,
	physicsObject: QueryPattern | QueryPattern[],
	callbacks: Optional<CoupleCallbacks<any>, 'onUpdate' | 'onDestroy'>
) => {
	const query = useQueries(system, {
		physxState: all(PhysXState),
		physicsObject
	});

	const getPhysXState = () => {
		return query.physxState.first?.get(PhysXState);
	};

	const couple = useCouple(query.physicsObject, {
		onCreate: entity => {
			const createdPhysicsObject = callbacks.onCreate(entity);
			const world = getPhysXState().scene;

			// if (createdPhysicsObject instanceof PhysX.RigidDynamic) {
			//     const body = createdPhysicsObject as PhysX.RigidDynamic;

			//     console.log("I SHOULD ADD")
			// }

			return createdPhysicsObject;
		},
		onUpdate: (entity, physicsObject, dt) => {
			if (callbacks.onUpdate) {
				if (physicsObject) {
					callbacks.onUpdate(entity, physicsObject, dt);
				}
			}
		},
		onDestroy: (entity, physicsObject) => {}
	});

	return couple;
};
