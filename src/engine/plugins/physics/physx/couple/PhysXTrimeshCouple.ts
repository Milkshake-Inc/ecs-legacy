import { useQueries } from '@ecs/core/helpers';
import { all, System } from 'tick-knock';
import { applyToMeshesIndividually, getObject3d } from '@ecs/plugins/physics/utils/PhysicsUtils';
import { Material } from 'three';
import { PhysXBody } from '../component/PhysXBody';
import { PhysXTrimesh } from '../component/shapes/TrimeshShape';
import { PhysXState } from '../PhysXPhysicsSystem';
import { createTrimesh } from '../utils/createTrimesh';
import { usePhysXCouple } from './PhysXCouple';
import { getShape } from './PhysXShapeCouple';

export const usePhysXTrimeshCouple = (system: System) => {
	const query = useQueries(system, {
		physxState: all(PhysXState)
	});

	const getPhysXState = () => {
		return query.physxState.first?.get(PhysXState);
	};

	return usePhysXCouple(system, all(PhysXTrimesh, PhysXBody), {
		onCreate: entity => {
			const { physics, ptrToEntity, cooking } = getPhysXState();

			if (getObject3d(entity)) {
				applyToMeshesIndividually(entity, ({ mesh, geometry, position, rotation }) => {
					const shape = getShape(entity);
					const { body } = entity.get(PhysXBody);

					// This is copy paste from ShapeCouple
					const trimesh = createTrimesh(cooking, physics, geometry.vertices, geometry.faces);
					const material = physics.createMaterial(shape.staticFriction, shape.dynamicFriction, shape.restitution);
					const shapeFlags = new PhysX.PxShapeFlags(shape.flags);

					shape.shape = physics.createShape(trimesh as any, material, true, shapeFlags);

					shape.shape.setContactOffset(0.0000001);
					shape.shape.setSimulationFilterData(new PhysX.PxFilterData(shape.collisionId, shape.collisionMask, 0, 0));
					shape.shape.setName((mesh.material as Material).name);

					body.attachShape(shape.shape);

					ptrToEntity.set(shape.shape.$$.ptr, entity);
				});
			}

			return {};
		}
	});
};
