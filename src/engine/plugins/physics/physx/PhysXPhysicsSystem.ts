///<reference path="PhysX.d.ts"/>

import { Entity } from '@ecs/core/Entity';
import { useEvents, useState } from '@ecs/core/helpers';
import { System } from '@ecs/core/System';
import { TubeBufferGeometry } from 'three';
import { PhysXBody } from './component/PhysXBody';
import { usePhysXBodyCouple } from './couple/PhysXBodyCouple';
import { usePhysXShapeCouple } from './couple/PhysXShapeCouple';
import { usePhysXTrimeshCouple } from './couple/PhysXTrimeshCouple';
import { createTCPPvdTransport } from './utils/TCPPvdTransport';

export class PhysXState {
	scene: PhysX.PxScene;
	physics: PhysX.PxPhysics;
	cooking: PhysX.PxCooking;

	ptrToEntity: Map<number, Entity> = new Map();
}




const version = PhysX.PX_PHYSICS_VERSION;
const defaultErrorCallback = new PhysX.PxDefaultErrorCallback();
const allocator = new PhysX.PxDefaultAllocator();
const foundation = PhysX.PxCreateFoundation(version, allocator, defaultErrorCallback);

// Debug Physics
let pvdDebug = null;

if (true) { // Debug
	pvdDebug = PhysX.PxCreatePvd(foundation);
	pvdDebug.connect(createTCPPvdTransport());
	console.info("Make sure PhysX is not using release build!");
}

const cookingParamas = new PhysX.PxCookingParams(new PhysX.PxTolerancesScale());
const cooking = PhysX.PxCreateCooking(version, foundation, cookingParamas);
const physics = PhysX.PxCreatePhysics(version, foundation, new PhysX.PxTolerancesScale(), false, pvdDebug);

export enum PhysXEvents {
	COLLISION_START = 'COLLISION_START',
	COLLISION_END = 'COLLISION_END',
	TRIGGER_START = 'TRIGGER_START',
	TRIGGER_END = 'TRIGGER_END'
}


export default class PhysXPhysicsSystem extends System {

	protected state = useState(this, new PhysXState());
	protected events = useEvents();
	protected couples = [usePhysXBodyCouple(this), usePhysXShapeCouple(this), usePhysXTrimeshCouple(this)];

	constructor() {
		super();

		this.state.cooking = cooking;
		this.state.physics = physics;

		const triggerCallback = {
			onContactBegin: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
				const entityA = this.findEntityByPhysxObject(shapeA);
				const entityB = this.findEntityByPhysxObject(shapeB);

				// Todo: Should this be emitted both ways A,B & B,A
				this.events.emit(PhysXEvents.COLLISION_START, entityB, entityA, shapeB, shapeA);
				// console.log(`Found Collision A: ${shapeA.getName()} B: ${shapeB.getName()}`);
			},
			onContactEnd: () => {
			},
			onContactPersist: () => { },
			onTriggerBegin: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
				const entityA = this.findEntityByPhysxObject(shapeA);
				const entityB = this.findEntityByPhysxObject(shapeB);

				this.events.emit(PhysXEvents.TRIGGER_START, entityA, entityB);
			},
			onTriggerEnd: () => { }
		};

		const physxSimulationCallbackInstance = (PhysX as any).PxSimulationEventCallback.implement(triggerCallback);

		const sceneDesc = (PhysX as any).getDefaultSceneDesc(this.state.physics.getTolerancesScale(), 0, physxSimulationCallbackInstance);

		this.state.scene = this.state.physics.createScene(sceneDesc);
		(this.state.scene as any).setGravity({ x: 0.0, y: -7, z: 0.0 });
	}

	findEntityByPhysxObject(object: PhysX.Base) {
		return this.state.ptrToEntity.get(object.$$.ptr);
	}

	update(dt: number) {
		super.update(dt);

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


