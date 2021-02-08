import { PxShapeFlag } from '../PxShapeFlags';

export enum ShapeType {
	TRI_MESH,
	BOX,
	PLANE,
	SPHERE
}

export abstract class PhysXShape {
	public shape: PhysX.PxShape;
	public shapeType: ShapeType;

	public collisionId: number = 1;
	public collisionMask: number = 1;

	public filterData: PhysX.PxFilterData;

	public staticFriction: number = 0.2;
	public dynamicFriction: number = 0.2;
	public restitution: number = 0.8;
	public flags: PxShapeFlag = PxShapeFlag.eVISUALIZATION | PxShapeFlag.eSCENE_QUERY_SHAPE | PxShapeFlag.eSIMULATION_SHAPE;
}
