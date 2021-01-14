import Quaternion from '@ecs/plugins/math/Quaternion';
import Vector3, { Vector } from '@ecs/plugins/math/Vector';
import { PxActorFlag } from '../PxActorFlag';
import { PxShapeFlag } from '../PxShapeFlags';

export class PhysXBody {
	body: PhysX.RigidActor;
	static: boolean = false;
	mass: number = 1;
	actorFlags: any = PxActorFlag.eVISUALIZATION;
	bodyFlags: number = 0;

	// Should shape properties be moved to shape class..

	private velocity: Vector3 = Vector3.ZERO;

	public setPosition(value: Vector) {
		const currentPose = this.body.getGlobalPose();
		currentPose.translation = value;
		this.body.setGlobalPose(currentPose, true);
	}

	public setRotation(value: Quaternion) {
		const currentPose = this.body.getGlobalPose();
		currentPose.rotation = value;
		this.body.setGlobalPose(currentPose, true);
	}

	public getRotation() {
		return this.body.getGlobalPose().rotation;
	}

	public clearVelocity() {
		this.body.setLinearVelocity({ x: 0, y: 0, z: 0 }, true);
	}

	public getVelocity() {
		this.velocity.setFromVector(this.body.getLinearVelocity());
		return this.velocity;
	}
}
