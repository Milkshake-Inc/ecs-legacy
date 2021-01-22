import { useQueries } from '@ecs/core/helpers';
import { System, all } from 'tick-knock';
import Transform from '@ecs/plugins/math/Transform';
import { PhysXBody } from '../component/PhysXBody';
import { PhysXState } from '../PhysXPhysicsSystem';
import { usePhysXCouple } from './PhysXCouple';

export const usePhysXBodyCouple = (system: System) => {
	const query = useQueries(system, {
		physxState: all(PhysXState)
	});

	const getPhysXState = () => {
		return query.physxState.first?.get(PhysXState);
	};

	return usePhysXCouple(system, all(PhysXBody), {
		onCreate: entity => {
			const body = entity.get(PhysXBody);
			const transform = entity.get(Transform);

			const { physics, scene } = getPhysXState();

			const pos = {
				translation: {
					x: transform.x,
					y: transform.y,
					z: transform.z
				},
				rotation: {
					w: transform.qw,
					x: transform.qx,
					y: transform.qy,
					z: transform.qz
				}
			};

			if (body.static) {
				body.body = physics.createRigidStatic(pos);
			} else {
				const dynamicBody = physics.createRigidDynamic(pos);
				dynamicBody.setMass(body.mass);

				const flags = new PhysX.PxRigidBodyFlags(body.bodyFlags);
				dynamicBody.setRigidBodyFlags(flags);
				dynamicBody.setAngularDamping(Infinity);
				// dynamicBody.setSolverIterationCounts(10, 10);
				// (dynamicBody as any).setMinCCDAdvanceCoefficient(0.0001);

				if (body.immovable) {
					dynamicBody.setMassSpaceInertiaTensor({ x: 0, y: 0, z: 0 });
				}

				body.body = dynamicBody;
			}

			(body.body as any).setActorFlags(new PhysX.PxActorFlags(body.actorFlags));

			scene.addActor(body.body, null);

			return body;
		},
		onUpdate: (entity, body) => {
			const transform = entity.get(Transform);
			const b: PhysX.RigidDynamic = body.body;

			const { translation, rotation } = b.getGlobalPose();

			transform.position.set(translation.x, translation.y, translation.z);
			transform.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
		},
		onDestroy: (entity, body) => {
			const { scene } = getPhysXState();
			scene.removeActor(body.body, null);
		}
	});
};
