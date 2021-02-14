/* eslint-disable no-prototype-builtins */
import { BufferGeometry, Group, InstancedMesh, Mesh, Object3D, Quaternion as ThreeQuaternion, Vector3 as ThreeVector3 } from 'three';
import { Entity } from 'tick-knock';

export const NoMeshError = new Error('no mesh found :(');

export const applyToMeshesIndividually = (
	entity: Entity,
	callback: (data: { mesh: Mesh; geometry: BufferGeometry; position: ThreeVector3; rotation: ThreeQuaternion }) => void
) => {
	let object3d = getObject3d(entity);
	if (!object3d) throw NoMeshError;

	object3d.position.set(0, 0, 0);
	object3d.rotation.set(0, 0, 0);

	object3d.traverse(mesh => {
		// mesh = mesh.clone();

		mesh.updateWorldMatrix(true, false);
		if (mesh instanceof Mesh) {
			if (mesh.userData.nocollider || mesh.parent?.userData.nocollider) return;

			// Get world pos, scale and rotation as the convex geometry does not copy that data
			// Applying the matrix directly to the convex geometry messes it up somehow and causes bad things to happen to collision.
			mesh.updateWorldMatrix(true, false);
			const position = new ThreeVector3();
			const scale = new ThreeVector3();
			const rotation = new ThreeQuaternion();

			mesh.matrixWorld.decompose(position, rotation, scale);

			// Scale the geometry
			const geometry = mesh.geometry.clone();
			geometry.scale(scale.x, scale.y, scale.z);

			callback({ mesh, geometry, position, rotation });
		}
	});
};

export const getObject3d = (entity: Entity) => {
	return entity.get(Mesh) || entity.get(InstancedMesh) || entity.get(Group);
};

export const getMesh = (entity: Entity) => {
	return entity.get(Mesh) || entity.get(InstancedMesh);
};
