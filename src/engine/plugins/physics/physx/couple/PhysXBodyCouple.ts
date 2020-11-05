import { useQueries } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { Vector } from '@ecs/plugins/math/Vector';
import TrimeshShape from '@ecs/plugins/physics/3d/components/TrimeshShape';
import { applyToMeshesIndividually } from '@ecs/plugins/physics/3d/couples/ShapeCouple';
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

			// console.log(transform.position);

			const pos = {
				translation: {
					x: transform.x,
					y: transform.y,
					z: transform.z
				},
				rotation: {
					w: transform.qw, // PhysX uses WXYZ quaternions,
					x: transform.qx,
					y: transform.qy,
					z: transform.qz
				}
			};

			if (body.static) {
				// console.log("aadd static")
				body.body = getPhysXState().physics.createRigidStatic(pos);
			} else {
				body.body = getPhysXState().physics.createRigidDynamic(pos);
				(body.body as any).setRigidBodyFlag(4, true);
			}

			(getPhysXState().scene as any).addActor(body.body, null);

			return body;
		},
		onUpdate: (entity, body) => {
			const transform = entity.get(Transform);
			const b: PhysX.RigidDynamic = body.body;

			const { translation, rotation } = b.getGlobalPose();

			transform.position.set(translation.x, translation.y, translation.z);
			transform.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
		}
	});
};
