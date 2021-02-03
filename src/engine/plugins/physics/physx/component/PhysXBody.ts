import Quaternion from '@ecs/plugins/math/Quaternion';
import Vector3, { Vector } from '@ecs/plugins/math/Vector';
import { PxActorFlag } from '../PxActorFlag';
import { PxShapeFlag } from '../PxShapeFlags';

export class PhysXBody {
	body: PhysX.RigidActor;
	static = false;
	mass = 1;
	actorFlags: any = PxActorFlag.eVISUALIZATION;
	bodyFlags = 0;
	immovable = false;

	// Should shape properties be moved to shape class..

	private velocity: Vector3 = Vector3.ZERO;
	private angularVelocity: Vector3 = Vector3.ZERO;

	public setPosition(value: Vector) {
		const currentPose = this.body.getGlobalPose();
		currentPose.translation = value;
		this.body.setGlobalPose(currentPose, true);
	}

	public getPosition() {
		const [x, y, z] = this.body.getGlobalPose().getPosition();
		return new Vector3(x, y, z);
	}

	public setRotation(value: Quaternion) {
		const currentPose = this.body.getGlobalPose();
		currentPose.rotation = value;
		(this.body as any).setKinematicTarget(currentPose);
	}

	public getRotation() {
		return this.body.getGlobalPose().rotation;
	}

	public clearVelocity() {
		this.body.setLinearVelocity({ x: 0, y: 0, z: 0 }, true);
	}

	public getVelocity() {
		return Vector3.From(this.body.getLinearVelocity());
	}

	public getAngularVelocity() {
		return Vector3.From(this.body.getAngularVelocity());
	}
}
