///<reference path="PhysX.d.ts"/>

import { Entity } from '@ecs/core/Entity';
import { useEvents, useState } from '@ecs/core/helpers';
import { System } from '@ecs/core/System';
import { usePhysXBodyCouple } from './couple/PhysXBodyCouple';
import { usePhysXShapeCouple } from './couple/PhysXShapeCouple';
import { usePhysXTrimeshCouple } from './couple/PhysXTrimeshCouple';

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

const cookingParamas = new PhysX.PxCookingParams(new PhysX.PxTolerancesScale());

export enum PhysXEvents {
	Collision = 'collision'
}

export default class PhysXPhysicsSystem extends System {
	protected state = useState(this, new PhysXState());
	protected events = useEvents();
	protected couples = [usePhysXBodyCouple(this), usePhysXShapeCouple(this), usePhysXTrimeshCouple(this)];

	constructor() {
		super();

		this.state.cooking = PhysX.PxCreateCooking(version, foundation, cookingParamas);
		this.state.physics = PhysX.PxCreatePhysics(version, foundation, new PhysX.PxTolerancesScale(), false, null);

		const triggerCallback = {
			onContactBegin: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
				const entityA = this.findEntityByPhysxObject(shapeA);
				const entityB = this.findEntityByPhysxObject(shapeB);

				// Todo: Should this be emitted both ways A,B & B,A
				this.events.emit(PhysXEvents.Collision, entityB, entityA);
			},
			onContactEnd: () => {},
			onContactPersist: () => {},
			onTriggerBegin: (shapeA: PhysX.PxShape, shapeB: PhysX.PxShape) => {
				const entityA = this.findEntityByPhysxObject(shapeA);
				const entityB = this.findEntityByPhysxObject(shapeB);

				this.events.emit(PhysXEvents.Collision, entityA, entityB);
			},
			onTriggerEnd: () => {}
		};

		const physxSimulationCallbackInstance = (PhysX as any).PxSimulationEventCallback.implement(triggerCallback);

		const sceneDesc = (PhysX as any).getDefaultSceneDesc(this.state.physics.getTolerancesScale(), 0, physxSimulationCallbackInstance);

		this.state.scene = this.state.physics.createScene(sceneDesc);
		(this.state.scene as any).setGravity({ x: 0.0, y: -7, z: 0.0 });
	}

	findEntityByPhysxObject(object: PhysX.Base) {
		return this.state.ptrToEntity.get(object.$$.ptr);
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
