import { Entity } from '@ecs/core/Entity';
import { useQueries } from '@ecs/core/helpers';
import { all, any } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Random from '@ecs/plugins/math/Random';
import { Vector } from '@ecs/plugins/math/Vector';
import TrimeshShape from '@ecs/plugins/physics/3d/components/TrimeshShape';
import { applyToMeshesIndividually } from '@ecs/plugins/physics/3d/couples/ShapeCouple';
import { PhysXBody } from '../component/PhysXBody';
import { PhysXPlane } from '../component/PhysXPlane';
import { PhysXSphere } from '../component/PhysXSphere';
import { PhysXBox } from '../component/PhysXBox';
import { PhysXState } from '../PhysXPhysicsSystem';
import { usePhysXCouple } from './PhysXCouple';

const generateShape = (entity: Entity) => {
	if (entity.has(PhysXPlane)) {
		return new PhysX.PxBoxGeometry(1000, 0.001, 1000);
		// return new PhysX.PxPlaneGeometry();
	}

	if (entity.has(PhysXSphere)) {
		const sphere = entity.get(PhysXSphere);
		return new PhysX.PxSphereGeometry(sphere.size);
	}

	if (entity.has(PhysXBox)) {
		const box = entity.get(PhysXBox);
		return new PhysX.PxBoxGeometry(box.size, box.size, box.size);
	}
};

export const usePhysXShapeCouple = (system: System) => {
	const query = useQueries(system, {
		physxState: all(PhysXState)
	});

	const getPhysXState = () => {
		return query.physxState.first?.get(PhysXState);
	};

	return usePhysXCouple(system, [all(PhysXBody), any(PhysXSphere, PhysXPlane, PhysXBox)], {
		onCreate: entity => {
			const { body, flags } = entity.get(PhysXBody);
			const { physics, ptrToEntity } = getPhysXState();

			const geomatry = generateShape(entity);

			const shapeFlags = new PhysX.PxShapeFlags(flags);

			const material = physics.createMaterial(0.2, 0.2, 0.5);
			const shape = physics.createShape(geomatry, material, true, shapeFlags);

			shape.setContactOffset(0.0001);

			const filterData = new (PhysX as any).PxFilterData(1, 1, 0, 0);

			ptrToEntity.set(shape.$$.ptr, entity);

			(shape as any).setSimulationFilterData(filterData);

			body.attachShape(shape);

			return shape;
		}
	});
};
