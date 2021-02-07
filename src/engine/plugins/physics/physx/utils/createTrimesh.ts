import { Vector } from '@ecs/plugins/math/Vector';

type Face = { a: number; b: number; c: number };

export const createTrimesh = (cooking: PhysX.PxCooking, physics: PhysX.PxPhysics, vertices: Vector[], faces: Face[]) => {
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

	const meshScale = new PhysX.PxMeshScale({ x: 10, y: 10, z: 10 }, { x: 0, y: 0, z: 0, w: 1 });
	const geometry = new PhysX.PxTriangleMeshGeometry(trimesh, meshScale, new PhysX.PxMeshGeometryFlags(0));

	PhysX._free(verticesPtr);
	PhysX._free(indicesPtr);

	return geometry;
};
