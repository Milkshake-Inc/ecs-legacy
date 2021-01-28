import { Vector } from '@ecs/plugins/math/Vector';
import { PhysXShape, ShapeType } from '../PhysXShape';

export class PhysXBox extends PhysXShape {
	shapeType = ShapeType.BOX;
	size: Vector;
}
