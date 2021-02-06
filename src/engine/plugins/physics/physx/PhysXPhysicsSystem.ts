///<reference path="PhysX.d.ts"/>

import { Entity, System } from 'tick-knock';
import { useEvents, useState } from '@ecs/core/helpers';
import Vector3, { Vector } from '@ecs/plugins/math/Vector';
import { usePhysXBodyCouple } from './couple/PhysXBodyCouple';
import { usePhysXShapeCouple } from './couple/PhysXShapeCouple';
import { usePhysXTrimeshCouple } from './couple/PhysXTrimeshCouple';
import { useControllerCouple } from './couple/PhysXControllerCouple';
import Transform from '@ecs/plugins/math/Transform';

export class PhysXState {
	scene: PhysX.PxScene;
	physics: PhysX.PxPhysics;
	cooking: PhysX.PxCooking;

	ptrToEntity: Map<number, Entity> = new Map();

	findEntity(object: PhysX.Base) {
		return this.ptrToEntity.get(object.$$.ptr);
	}

	raycast(
		origin: Vector3,
		direction: Vector3,
		maxDistance: number,
		buffer: PhysX.PxRaycastBuffer = PhysX.allocateRaycastHitBuffers(5)
	): PhysX.PxRaycastBuffer | null {
		const result = this.scene.raycast(origin, direction, maxDistance, buffer);
		return result ? buffer : null;
	}

	findClosest(entity: Entity, direction: Vector3, maxDistance: number) {
		const result = this.raycast(entity.get(Transform).position, direction, maxDistance);
		let closestCollision: PhysX.PxRaycastHit = null;
		for (let index = 0; index < result.getNbTouches(); index++) {
			const touch = result.getTouch(index);
			const touchEntity = this.findEntity(touch.getShape());

			if (touchEntity != entity) {
				if (!closestCollision || touch.distance < closestCollision.distance) {
					closestCollision = touch;
				}
			}
		}

		return closestCollision ? this.findEntity(closestCollision.getShape()) : null;
	}

	sweep(origin: Vector3, direction: Vector3, maxDistance: number, buffer: PhysX.PxRaycastBuffer): PhysX.PxRaycastBuffer | null {
		const transform = {
			translation: {
				x: origin.x,
				y: origin.y,
				z: origin.z
			},
			rotation: {
				x: 0,
				y: 0,
				z: 0,
				w: 0
			}
		};
		const result = this.scene.sweep(new PhysX.PxSphereGeometry(0.3), transform as any, direction, maxDistance, buffer);
		return result ? buffer : null;
	}
}

const version = PhysX.PX_PHYSICS_VERSION;
const defaultErrorCallback = new PhysX.PxDefaultErrorCallback();
const allocator = new PhysX.PxDefaultAllocator();
const foundation = PhysX.PxCreateFoundation(version, allocator, defaultErrorCallback);

// Debug Physics
// let pvdDebug = PhysX.PxCreatePvd(foundation)
// pvdDebug.connect(createTCPPvdTransport())

const cookingParamas = new PhysX.PxCookingParams(new PhysX.PxTolerancesScale());
const cooking = PhysX.PxCreateCooking(version, foundation, cookingParamas);
export const physics = PhysX.PxCreatePhysics(version, foundation, new PhysX.PxTolerancesScale(), false, null);

export enum PhysXEvents {
	COLLISION_START = 'COLLISION_START',
	COLLISION_PERSIST = 'COLLISION_PERSIST',
	COLLISION_END = 'COLLISION_END',

	TRIGGER_START = 'TRIGGER_START',
	TRIGGER_END = 'TRIGGER_END',

	CONTROLLER_SHAPE_HIT = 'CONTROLLER_SHAPE_HIT',
	CONTROLLER_CONTROLLER_HIT = 'CONTROLLER_CONTROLLER_HIT',
	CONTROLLER_OBSTACLE_HIT = 'CONTROLLER_OBSTACLE_HIT'
}

export default class PhysXPhysicsSystem extends System {
	protected state = useState(this, new PhysXState());
	protected events = useEvents();
	protected couples = [usePhysXBodyCouple(this), usePhysXShapeCouple(this), usePhysXTrimeshCouple(this), useControllerCouple(this)];

	constructor() {
		super();

		this.state.cooking = cooking;
		this.state.physics = physics;

		const emitCollisionEvents = (event: PhysXEvents, shapeA: PhysX.PxShape, shapeB: PhysX.PxShape, normal?: Vector) => {
			const entityA = this.state.findEntity(shapeA);
			const entityB = this.state.findEntity(shapeB);

			// Todo: Should this be emitted both ways A,B & B,A
			// this.events.emit(event, entityB, entityA, shapeB, shapeA);
			this.events.emit(event, entityA, entityB, shapeA, shapeB, normal);
		};

		const triggerCallback = {
			onContactBegin: emitCollisionEvents.bind(this, PhysXEvents.COLLISION_START),
			onContactEnd: emitCollisionEvents.bind(this, PhysXEvents.COLLISION_END),
			onContactPersist: emitCollisionEvents.bind(this, PhysXEvents.COLLISION_PERSIST),
			onTriggerBegin: emitCollisionEvents.bind(this, PhysXEvents.TRIGGER_START),
			onTriggerEnd: emitCollisionEvents.bind(this, PhysXEvents.TRIGGER_END)
		};

		// const triggerCallback = {
		// 	onContactBegin: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
		// 		const entityA = this.state.findEntity(shapeA);
		// 		const entityB = this.state.findEntity(shapeB);

		// 		// Todo: Should this be emitted both ways A,B & B,A
		// 		this.events.emit(PhysXEvents.COLLISION_START, entityB, entityA, shapeB, shapeA);
		// 		// console.log(`Found Collision A: ${shapeA.getName()} B: ${shapeB.getName()}`);
		// 	},
		// 	onContactEnd: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
		// 		const entityA = this.state.findEntity(shapeA);
		// 		const entityB = this.state.findEntity(shapeB);

		// 		// Todo: Should this be emitted both ways A,B & B,A
		// 		this.events.emit(PhysXEvents.COLLISION_END, entityB, entityA, shapeB, shapeA);
		// 	},
		// 	onContactPersist: () => {},
		// 	onTriggerBegin: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
		// 		const entityA = this.state.findEntity(shapeA);
		// 		const entityB = this.state.findEntity(shapeB);

		// 		this.events.emit(PhysXEvents.TRIGGER_START, entityA, entityB);
		// 	},
		// 	onTriggerEnd: () => {}
		// };
		const scale = this.state.physics.getTolerancesScale();

		// scale.length = 0.001;
		// scale.speed = 0.01;
		const physxSimulationCallbackInstance = PhysX.PxSimulationEventCallback.implement(triggerCallback as any);
		const sceneDesc = PhysX.getDefaultSceneDesc(scale, 0, physxSimulationCallbackInstance);
		sceneDesc.bounceThresholdVelocity = 0.001;

		this.state.scene = this.state.physics.createScene(sceneDesc);
		this.state.scene.setGravity({ x: 0.0, y: -7, z: 0.0 });
	}

	updateFixed(dt: number) {
		super.updateFixed(dt);

		if (this.state.scene) {
			const subSteps = 10;
			const timePerStep = dt / 1000 / subSteps;

			for (let index = 0; index < subSteps; index++) {
				this.state.scene.simulate(timePerStep, true);
				this.state.scene.fetchResults(true);
			}

			this.couples.forEach(c => c.update(dt));
		}
	}
}
