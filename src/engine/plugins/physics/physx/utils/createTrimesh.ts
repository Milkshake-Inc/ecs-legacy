export const createTrimesh = (
	cooking: PhysX.PxCooking,
	physics: PhysX.PxPhysics,
	vertices: ArrayLike<number>,
	indices: ArrayLike<number>
) => {
	const verticesPtr = PhysX._malloc(4 * vertices.length);
	let verticesOffset = 0;

	for (let i = 0; i < vertices.length; i++) {
		PhysX.HEAPF32[(verticesPtr + verticesOffset) >> 2] = vertices[i];
		verticesOffset += 4;
	}

	const indicesPtr = PhysX._malloc(4 * indices.length);
	let indicesOffset = 0;

	for (let i = 0; i < indices.length; i++) {
		PhysX.HEAPU32[(indicesPtr + indicesOffset) >> 2] = indices[i];
		indicesOffset += 4;
	}

	const trimesh = cooking.createTriMesh(verticesPtr, vertices.length / 3, indicesPtr, indices.length / 3, false, physics);

	const meshScale = new PhysX.PxMeshScale({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0, w: 1 });
	const geometry = new PhysX.PxTriangleMeshGeometry(trimesh, meshScale, new PhysX.PxMeshGeometryFlags(0));

	PhysX._free(verticesPtr);
	PhysX._free(indicesPtr);

	return geometry;
};
