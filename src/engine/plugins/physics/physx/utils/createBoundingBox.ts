import { Mesh, Vector3 as ThreeVector3, Box3 } from 'three';
import { PhysXBox } from '../component/shapes/PhysXBox';

export const createBoundingBox = (mesh: Mesh) => {
	const box3 = new Box3();
	box3.setFromObject(mesh);

	// Get bounds size
	const size = new ThreeVector3();
	box3.getSize(size);

	const box = new PhysXBox();
	box.size = size.divideScalar(2);
	box.restitution = 0;

	return box;
};
