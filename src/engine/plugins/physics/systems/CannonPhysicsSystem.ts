import { useState, useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import PhysicsState from '../components/PhysicsState';
import { useBodyCouple } from '../couples/BodyCouple';
import { useShapeCouple } from '../couples/ShapeCouple';
import { useContactMaterialCouple } from '../couples/ContactMaterialCouple';
import { useConstraintCouple } from '../couples/ConstraintCouple';
import { useMaterialCouple } from '../couples/MaterialCouple';
import { World, SAPBroadphase, GSSolver } from 'cannon-es';
import Vector3 from '@ecs/math/Vector';
import { any } from '@ecs/utils/QueryHelper';
import RenderState from '@ecs/plugins/3d/components/RenderState';
import CannonDebugRenderer from '../utils/CannonRenderer';
import { useInstancedBodyCouple } from '../couples/InstancedBodyCouple';

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

	protected debugRenderer;
	protected debug = false;
	protected gravity = DefaultGravity;

	constructor(gravity = DefaultGravity, iterations = 10, debug = false) {
		super();

		const world = new World();
		world.broadphase = new SAPBroadphase(world);
		(world.solver as GSSolver).iterations = iterations;
		world.allowSleep = true;

		this.state.gravity = gravity;
		this.state.world = world;
		this.debug = debug;
	}

	updateFixed(dt: number) {
		super.updateFixed(dt);
		this.state.frameTime = dt / 1000;
		this.state.world.gravity.set(this.state.gravity.x, this.state.gravity.y, this.state.gravity.z);
		this.state.world.step(this.state.frameTime);

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
