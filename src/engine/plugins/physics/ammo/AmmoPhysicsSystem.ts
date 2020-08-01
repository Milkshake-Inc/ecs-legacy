import { useState } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Ammo from 'ammojs-typed';
import { Entity } from '@ecs/ecs/Entity';
import Collisions from '../3d/components/Collisions';
import { useAmmoTrimeshCouple } from './couples/AmmoTrimeshCouple';
import { useAmmoSphereCouple } from './couples/AmmoSphereCouple';
import { useAmmoPlaneCouple } from './couples/AmmoPlaneCouple';
import { useAmmoBoxCouple } from './couples/AmmoBoxCouple';
import Vector3 from '@ecs/plugins/math/Vector';

type Unpacked<T> =
    T extends (infer U)[] ? U :
    T extends (...args: any[]) => infer U ? U :
    T extends Promise<infer U> ? U :
	T;


export type AmmoType = Unpacked<ReturnType<typeof Ammo>>;
export let AmmoInstance: AmmoType = null;

export const setAmmo = (ammo: any) => {
	AmmoInstance = ammo;
}

export class AmmoState {
	world: Ammo.btDiscreteDynamicsWorld
	ground: Ammo.btRigidBody;
}

export default class AmmoPhysicsSystem extends System {
	protected state = useState(this, new AmmoState());

	protected couples = [
		useAmmoTrimeshCouple(this),
		useAmmoSphereCouple(this),
		useAmmoPlaneCouple(this),
		useAmmoBoxCouple(this),
	];

	constructor(gravity: Vector3 = new Vector3(0, -1, 0)) {
		super();

		this.state.world = this.createWorld(gravity);
	}

	protected createWorld(gravity: Vector3): Ammo.btDiscreteDynamicsWorld {
		const collisionConfiguration = new AmmoInstance.btDefaultCollisionConfiguration();
		const dispatcher = new AmmoInstance.btCollisionDispatcher(collisionConfiguration);
		const broadphase = new AmmoInstance.btDbvtBroadphase();
		const solver = new AmmoInstance.btSequentialImpulseConstraintSolver();
		const world = new AmmoInstance.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);

		world.setGravity(new AmmoInstance.btVector3(gravity.x, gravity.y, gravity.z));

		return world;
	}

	findEntityByAmmoObject(ammoObject: Ammo.btCollisionObject): Entity {
		for (const couple of this.couples) {
			const entity = couple.getEntity(ammoObject);

			if(entity) return entity;
		}
	}

	updateFixed(dt: number) {
		super.updateFixed(dt);

		if(this.state.world) {
			this.state.world.stepSimulation(dt / 10, 10);
			this.updateCollisions();
		}

		this.couples.forEach(couple => couple.update(dt));
	}

	updateCollisions() {
		const collisionCount = this.state.world.getDispatcher().getNumManifolds();

		for (let index = 0; index < collisionCount; index++) {
			const element = this.state.world.getDispatcher().getManifoldByIndexInternal(index);

			if(element.getNumContacts() > 0) {
				const entityA = this.findEntityByAmmoObject(element.getBody0())
				const entityB = this.findEntityByAmmoObject(element.getBody1())

				if(entityA && entityB) {
					entityA.get(Collisions).contacts.add(entityB);
					entityB.get(Collisions).contacts.add(entityA);
				}
			}
		}
	}

	updateLate(dt: number) {
		this.couples.forEach(couple => couple.lateUpdate(dt));
	}

	update(dt: number) {
		super.update(dt);
	}
}
