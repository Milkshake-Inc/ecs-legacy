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


export enum CollisionFilterGroups {
	NoFilter = 0,
	DefaultFilter = 1,
	StaticFilter = 2,
	KinematicFilter = 4,
	DebrisFilter = 8,
	SensorTrigger = 16,
	CharacterFilter = 32,

	Terrain = 64,
	Ground = 128,
	Ball = 256,

	AllFilter = -1

}

export default class AmmoBody extends AmmoInstance.btRigidBody {

	public groups?: CollisionFilterGroups;
	public groupsCollideWith?: CollisionFilterGroups;

	private _mass: number;

	private cachedVector: Ammo.btVector3;
	private cachedQuaternion: Ammo.btQuaternion;

	constructor(mass = 0) {
		super(new AmmoInstance.btRigidBodyConstructionInfo(mass, new AmmoInstance.btDefaultMotionState(), new AmmoInstance.btEmptyShape()));
		this._mass = mass;

		this.cachedVector = new AmmoInstance.btVector3();
		this.cachedQuaternion = new AmmoInstance.btQuaternion(0, 0, 0, 0);
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
		this.cachedVector.setValue(0, 0, 0);
		this.getCollisionShape().calculateLocalInertia(value, this.cachedVector);
		this.setMassProps(value, this.cachedVector);
		this.activate(true);
	}

	public get position() {
		const pos = this.getWorldTransform().getOrigin();
		return { x: pos.x(), y: pos.y(), z: pos.z() };
	}

	public set position(value: Vector) {
		this.cachedVector.setValue(value.x, value.y, value.z);
		this.getWorldTransform().setOrigin(this.cachedVector);
		this.activate(true);
	}

	public get quaternion() {
		const q = this.getWorldTransform().getRotation();
		return new Quaternion(q.x(), q.y(), q.z(), q.w());
	}

	public set quaternion(value: Quaternion) {
		this.cachedQuaternion.setValue(value.x, value.y, value.z, value.w);
		this.getWorldTransform().setRotation(this.cachedQuaternion);
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
		super.clearForces();

		this.cachedVector.setValue(0, 0, 0);
		this.setLinearVelocity(this.cachedVector);
		this.setAngularVelocity(this.cachedVector);

		this.activate(true);
	}

	public applyCentralImpulseV(vector: Vector) {
		this.cachedVector.setValue(vector.x, vector.y, vector.z);
		this.applyCentralImpulse(this.cachedVector);
		this.activate(true);
	}

	public rotate(euler: Vector3 | Vector) {
		this.quaternion = this.quaternion.multiply(new Quaternion().setFromEuler(euler));
		this.activate(true);
	}
}
