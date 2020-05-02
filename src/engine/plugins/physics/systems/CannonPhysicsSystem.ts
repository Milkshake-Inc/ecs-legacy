import { useState, useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import PhysicsState from '../components/PhysicsState';
import { useBodyCouple } from '../couples/BodyCouple';
import { useShapeCouple } from '../couples/ShapeCouple';
import { useContactMaterialCouple } from '../couples/ContactMaterialCouple';
import { useConstraintCouple } from '../couples/ConstraintCouple';
import { useMaterialCouple } from '../couples/MaterialCouple';
import { World, NaiveBroadphase } from 'cannon';
import Vector3 from '@ecs/math/Vector';
import { any } from '@ecs/utils/QueryHelper';
import RenderState from '@ecs/plugins/3d/components/RenderState';

export default class CannonPhysicsSystem extends System {
	protected state = useState(this, new PhysicsState());

	// Query passed in must be added to engine.... & update has to be called manually
	protected couples = [
		useBodyCouple(this),
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
	protected gravity = Vector3.ZERO;

	constructor(gravity = Vector3.ZERO, iterations = 2, debug = false) {
		super();

		this.state.world = new World();
		this.state.gravity = gravity;
		this.state.world.solver.iterations = iterations;
		this.state.broadPhase = new NaiveBroadphase();
		this.state.world.solver.iterations = iterations;
		this.debug = debug;
	}

	updateFixed(dt: number) {
		super.updateFixed(dt);

		this.state.world.step(dt / 1000);

		this.couples.forEach(couple => couple.update(dt));

		this.state.world.gravity.set(this.state.gravity.x, this.state.gravity.y, this.state.gravity.z);
	}

	update(dt: number) {
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
			// Legacy hacks...
			global['THREE'] = require('three');
			global['CANNON'] = require('cannon');
			require('cannon/tools/threejs/CannonDebugRenderer');
			this.debugRenderer = new global['THREE'].CannonDebugRenderer(scene, this.state.world);
		}
	}
}
