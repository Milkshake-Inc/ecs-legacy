import { useQueries } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import { Vector } from '@ecs/plugins/math/Vector';
import TrimeshShape from '@ecs/plugins/physics/3d/components/TrimeshShape';
import { applyToMeshesIndividually, getObject3d } from '@ecs/plugins/physics/3d/couples/ShapeCouple';
import { PhysXBody } from '../component/PhysXBody';
import { PhysXState } from '../PhysXPhysicsSystem';
import { usePhysXCouple } from './PhysXCouple';

export const usePhysXTrimeshCouple = (system: System) => {
	const query = useQueries(system, {
		physxState: all(PhysXState)
	});

	const getPhysXState = () => {
		return query.physxState.first?.get(PhysXState);
	};

	return usePhysXCouple(system, all(TrimeshShape, PhysXBody), {
		onCreate: entity => {
			const physXBody = entity.get(PhysXBody);

			const { cooking, physics, ptrToEntity } = getPhysXState();

			if (getObject3d(entity)) {
				applyToMeshesIndividually(entity, ({ mesh, geometry, position, rotation }) => {
					const trimesh = createTrimesh(cooking, physics, geometry.vertices, geometry.faces);

					const flags = new PhysX.PxShapeFlags(physXBody.shapeFlags);
					const material = physics.createMaterial(physXBody.staticFriction, physXBody.dynamicFriction, physXBody.restitution);
					const shape = physics.createShape(trimesh as any, material, false, flags);

					let materialName: string = (mesh.material as any).name || "None";

					shape.setName(materialName);
					shape.setContactOffset(0.0001);

					ptrToEntity.set(shape.$$.ptr, entity);

					physXBody.body.attachShape(shape);

					(shape as any).setSimulationFilterData(new (PhysX as any).PxFilterData(1, 1, 0, 0));
				});
			}

			return {};
		}
	});
};

type Face = { a: number; b: number; c: number };

enum PxMeshPreprocessingFlag {
	eWELD_VERTICES = 1 << 0,
	eDISABLE_CLEAN_MESH = 1 << 1,
	eDISABLE_ACTIVE_EDGES_PRECOMPUTE = 1 << 2,
	eFORCE_32BIT_INDICES = 1 << 3
}

const createTrimesh = (cooking: PhysX.PxCooking, physics: PhysX.PxPhysics, vertices: Vector[], faces: Face[]) => {
	const verticesPtr = PhysX._malloc(4 * vertices.length * 3);
	let verticesOffset = 0;

	for (let i = 0; i < vertices.length; i++) {
		PhysX.HEAPF32[(verticesPtr + verticesOffset) >> 2] = vertices[i].x;
		verticesOffset += 4;

		PhysX.HEAPF32[(verticesPtr + verticesOffset) >> 2] = vertices[i].y;
		verticesOffset += 4;

		PhysX.HEAPF32[(verticesPtr + verticesOffset) >> 2] = vertices[i].z;
		verticesOffset += 4;
	}

	const indicesPtr = PhysX._malloc(4 * faces.length * 3);
	let indicesOffset = 0;

	for (let i = 0; i < faces.length; i++) {
		PhysX.HEAPU32[(indicesPtr + indicesOffset) >> 2] = faces[i].a;
		indicesOffset += 4;

		PhysX.HEAPU32[(indicesPtr + indicesOffset) >> 2] = faces[i].b;
		indicesOffset += 4;

		PhysX.HEAPU32[(indicesPtr + indicesOffset) >> 2] = faces[i].c;
		indicesOffset += 4;
	}

	const trimesh = cooking.createTriMesh(verticesPtr, vertices.length, indicesPtr, faces.length, false, physics);

	const meshScale = new PhysX.PxMeshScale({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0, w: 1 });
	const geometry = new PhysX.PxTriangleMeshGeometry(trimesh, meshScale, new PhysX.PxMeshGeometryFlags(0));

	PhysX._free(verticesPtr);
	PhysX._free(indicesPtr);

	return geometry;
};
