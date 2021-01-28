import { Entity, all, any, System } from 'tick-knock';
import { useQueries } from '@ecs/core/helpers';
import { PhysXBody } from '../component/PhysXBody';
import { ShapeType } from '../component/PhysXShape';
import { PhysXBox } from '../component/shapes/PhysXBox';
import { PhysXPlane } from '../component/shapes/PhysXPlane';
import { PhysXSphere } from '../component/shapes/PhysXSphere';
import { PhysXTrimesh } from '../component/shapes/TrimeshShape';
import { PhysXState } from '../PhysXPhysicsSystem';
import { usePhysXCouple } from './PhysXCouple';

const generateShape = (entity: Entity) => {
	if (entity.has(PhysXPlane)) {
		return new PhysX.PxBoxGeometry(1000, 0.001, 1000);
	}

	if (entity.has(PhysXSphere)) {
		const sphere = entity.get(PhysXSphere);
		return new PhysX.PxSphereGeometry(sphere.size);
	}

	if (entity.has(PhysXBox)) {
		const box = entity.get(PhysXBox);
		return new PhysX.PxBoxGeometry(box.size.x, box.size.y, box.size.z);
	}
};

export const getShape = (entity: Entity) => {
	if (entity.has(PhysXPlane)) return entity.get(PhysXPlane);
	if (entity.has(PhysXSphere)) return entity.get(PhysXSphere);
	if (entity.has(PhysXBox)) return entity.get(PhysXBox);
	if (entity.has(PhysXTrimesh)) return entity.get(PhysXTrimesh);

	return null;
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
			const shape = getShape(entity);
			const { body } = entity.get(PhysXBody);
			const { physics, ptrToEntity } = getPhysXState();

			const geometry = generateShape(entity);
			const material = physics.createMaterial(shape.staticFriction, shape.dynamicFriction, shape.restitution);
			const shapeFlags = new PhysX.PxShapeFlags(shape.flags);

			shape.shape = physics.createShape(geometry, material, true, shapeFlags);

			shape.shape.setContactOffset(0.000001);
			shape.shape.setSimulationFilterData(new PhysX.PxFilterData(shape.collisionId, shape.collisionMask, 0, 0));
			shape.shape.setName(ShapeType[shape.shapeType]);

			body.attachShape(shape.shape);

			ptrToEntity.set(shape.shape.$$.ptr, entity);

			return shape;
		}
	});
};
