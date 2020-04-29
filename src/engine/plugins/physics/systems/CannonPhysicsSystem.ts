import { useState } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import PhysicsState from '../components/PhysicsState';
import { useBodyCouple } from '../couples/BodyCouple';
import { useShapeCouple } from '../couples/ShapeCouple';
import { useContactMaterialCouple } from '../couples/ContactMaterialCouple';
import { useConstraintCouple } from '../couples/ConstraintCouple';
import { useMaterialCouple } from '../couples/MaterialCouple';
import { World, NaiveBroadphase } from 'cannon';
import Vector3 from '@ecs/math/Vector';

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

	constructor(gravity = Vector3.ZERO, iterations = 2) {
		super();

		this.state.world = new World();
		this.state.world.gravity.set(gravity.x, gravity.y, gravity.z);
		this.state.world.solver.iterations = iterations;
		this.state.broadPhase = new NaiveBroadphase();
		this.state.world.solver.iterations = iterations;
	}

	updateFixed(dt: number) {
		super.updateFixed(dt);

		this.couples.forEach(couple => couple.update(dt));

		this.state.world.step(dt);
	}
}
