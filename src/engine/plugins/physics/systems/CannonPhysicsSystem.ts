import { useQueries, useState } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Vector3 from '@ecs/math/Vector';
import RenderState from '@ecs/plugins/3d/components/RenderState';
import { any } from '@ecs/utils/QueryHelper';
import { GSSolver, World } from 'cannon-es';
import PhysicsState from '../components/PhysicsState';
import { useBodyCouple } from '../couples/BodyCouple';
import { useConstraintCouple } from '../couples/ConstraintCouple';
import { useContactMaterialCouple } from '../couples/ContactMaterialCouple';
import { useInstancedBodyCouple } from '../couples/InstancedBodyCouple';
import { useMaterialCouple } from '../couples/MaterialCouple';
import { useShapeCouple } from '../couples/ShapeCouple';
import CannonDebugRenderer from '../utils/CannonRenderer';

export const DefaultGravity = new Vector3(0, -9.81, 0);

export enum CollisionGroups {
	Default = 1,
	Characters = 2,
	Vehicles = 4
}

export default class CannonPhysicsSystem extends System {
	protected state = useState(this, new PhysicsState());

	// Query passed in must be added to engine.... & update has to be called manually
	protected couples = [
		useBodyCouple(this),
		useInstancedBodyCouple(this),
		useShapeCouple(this),
		useConstraintCouple(this),
		useContactMaterialCouple(this),
		useMaterialCouple(this)
	];

	protected queries = useQueries(this, {
		renderState: any(RenderState)
	});

	protected debugRenderer: CannonDebugRenderer;
	protected debug = false;
	protected gravity = DefaultGravity;
	protected subSteps = 1;

	constructor(gravity = DefaultGravity, iterations = 10, debug = false, subSteps = 1) {
		super();

		this.state.world = new World();
		(this.state.world.solver as GSSolver).iterations = iterations;

		this.state.gravity = gravity;
		this.debug = debug;
		this.subSteps = subSteps;
	}

	updateFixed(dt: number) {
		super.updateFixed(dt);

		this.state.world.gravity.set(this.state.gravity.x, this.state.gravity.y, this.state.gravity.z);

		this.state.frameTime = dt / 1000;

		const subStepFrameTime = this.state.frameTime / this.subSteps;

		for (let subStep = 0; subStep < this.subSteps; subStep++) {
			this.state.world.step(subStepFrameTime);
		}

		this.couples.forEach(couple => couple.update(dt));
	}

	update(dt: number) {
		super.update(dt);

		if (this.debug && !this.debugRenderer) {
			this.createDebugRenderer();
		}

		if (this.debugRenderer) {
			this.debugRenderer.update();
		}
	}

	private createDebugRenderer() {
		const scene = this.queries.renderState?.first?.get(RenderState).scene;
		if (scene) {
			this.debugRenderer = new CannonDebugRenderer(scene, this.state.world);
		}
	}
}
