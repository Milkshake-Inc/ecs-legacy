import Ammo from 'ammojs-typed';
import Vector3, { Vector } from '@ecs/plugins/math/Vector';
import Quaternion from '@ecs/plugins/math/Quaternion';
import { AmmoInstance } from '../AmmoLoader';

export enum BodyType {
	Dynamic = 0,
	Static = 1,
	Kinematic = 2,
	Ghost = 4
}

export default class AmmoBody extends AmmoInstance.btRigidBody {
	private _mass: number;

	constructor(mass = 0) {
		super(new AmmoInstance.btRigidBodyConstructionInfo(mass, new AmmoInstance.btDefaultMotionState(), new AmmoInstance.btEmptyShape()));
		this._mass = mass;
	}

	public get moving() {
		return this.getLinearVelocity().length() > 0;
	}

	public get ghost() {
		return this.collisionFlags == BodyType.Ghost;
	}

	public set ghost(value: boolean) {
		if (value) {
			this.setCollisionFlags(BodyType.Ghost);
		}
	}

	public get shape() {
		return this.getCollisionShape();
	}

	public set shape(value: Ammo.btCollisionShape) {
		this.setCollisionShape(value);
		this.mass = this._mass; // Recalculate inertia
	}

	public get mass() {
		return this._mass;
	}

	public set mass(value: number) {
		const localInertia = new AmmoInstance.btVector3(0, 0, 0);
		this.getCollisionShape().calculateLocalInertia(value, localInertia);
		this.setMassProps(value, localInertia);
		this.activate(true);
	}

	public get position() {
		const pos = this.getWorldTransform().getOrigin();
		return { x: pos.x(), y: pos.y(), z: pos.z() };
	}

	public set position(value: Vector) {
		this.getWorldTransform().setOrigin(new AmmoInstance.btVector3(value.x, value.y, value.z));
		this.activate(true);
	}

	public get quaternion() {
		const q = this.getWorldTransform().getRotation();
		return new Quaternion(q.x(), q.y(), q.z(), q.w());
	}

	public set quaternion(value: Quaternion) {
		this.getWorldTransform().setRotation(new AmmoInstance.btQuaternion(value.x, value.y, value.z, value.w));
		this.activate(true);
	}

	public get restitution() {
		return this.getRestitution();
	}

	public set restitution(value: number) {
		this.setRestitution(value);
	}

	public get friction() {
		return this.getFriction();
	}

	public set friction(value: number) {
		this.setFriction(value);
	}

	public get rollingFriction() {
		return this.getRollingFriction();
	}

	public set rollingFriction(value: number) {
		this.setRollingFriction(value);
	}

	public get collisionFlags() {
		return this.getCollisionFlags();
	}

	public set collisionFlags(value: number) {
		this.setCollisionFlags(value);
	}

	public get worldTransform() {
		return this.getWorldTransform();
	}

	public set worldTransform(value: Ammo.btTransform) {
		this.setWorldTransform(value);
	}

	public get collisionShape() {
		return this.getCollisionShape();
	}

	public set collisionShape(value: Ammo.btCollisionShape) {
		this.setCollisionShape(value);
	}

	public set ccdMotionThreshold(value: number) {
		this.setCcdMotionThreshold(value);
	}

	public set ccdSweptSphereRadius(value: number) {
		this.setCcdSweptSphereRadius(value);
	}

	public clearForces() {
		// super.clearForces();
		this.setLinearVelocity(new AmmoInstance.btVector3(0, 0, 0));
		this.setAngularVelocity(new AmmoInstance.btVector3(0, 0, 0));
		this.activate(true);
	}

	public applyCentralImpulseV(vector: Vector) {
		this.applyCentralImpulse(new AmmoInstance.btVector3(vector.x, vector.y, vector.z));
		this.activate(true);
	}

	public rotate(euler: Vector3 | Vector) {
		this.quaternion = this.quaternion.multiply(new Quaternion().setFromEuler(euler));
		this.activate(true);
	}
}
