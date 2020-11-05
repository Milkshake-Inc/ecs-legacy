import { Vector } from '@ecs/plugins/math/Vector';
import { PxShapeFlag } from '../PxShapeFlags';

export class PhysXBody {
	body: PhysX.RigidBody;
	static: boolean = false;
	staticFriction: number = 0.1;
	dynamicFriction: number = 0.1;
	restitution: number = 0.2;
	flags: number = PxShapeFlag.eSCENE_QUERY_SHAPE | PxShapeFlag.eSIMULATION_SHAPE;

	public setPosition(value: Vector) {
		const currentPose = this.body.getGlobalPose();
		currentPose.translation = value;
		this.body.setGlobalPose(currentPose, true);
	}

	public clearVelocity() {
		this.body.setLinearVelocity({ x: 0, y: 0, z: 0 }, true);
	}
}
