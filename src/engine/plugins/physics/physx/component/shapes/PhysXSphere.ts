import { PhysXShape, ShapeType } from '../PhysXShape';

export class PhysXSphere extends PhysXShape {
	shapeType = ShapeType.SPHERE;
	size: number;
}
