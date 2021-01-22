import { all, EntitySnapshot, System } from 'tick-knock';
import MathHelper from '@ecs/plugins/math/MathHelper';
import Transform from '@ecs/plugins/math/Transform';
import { ArcadeCollisionShape } from '../components/ArcadeCollisionShape';
import ArcadePhysics from '../components/ArcadePhysics';
import { useQueries } from '@ecs/core/helpers';

export default class ArcadePhysicsSystem extends System {
	protected queries = useQueries(this, {
		bodies: all(Transform, ArcadePhysics)
	});

	constructor() {
		super();

		this.queries.bodies.onEntityAdded.connect(entity => this.onEntityAdded(entity));
	}

	protected onEntityAdded(entitySnapshot: EntitySnapshot) {
		const transfrom = entitySnapshot.entity.get(Transform);
		const shape = entitySnapshot.entity.get(ArcadeCollisionShape);

		shape.shape.pos.x = transfrom.x;
		shape.shape.pos.y = transfrom.y;
	}

	updateFixed(dt: number) {
		this.queries.bodies.forEach(entity => {
			const collider = entity.get(ArcadeCollisionShape);
			const physics = entity.get(ArcadePhysics);

			collider.shape.pos.x += physics.velocity.x * dt;
			collider.shape.pos.y += physics.velocity.y * dt;

			physics.velocity.x *= physics.friction;
			physics.velocity.y *= physics.friction;

			if (physics.velocity.x > physics.maxVelocity) physics.velocity.x = physics.maxVelocity;
			if (physics.velocity.y > physics.maxVelocity) physics.velocity.y = physics.maxVelocity;
		});
	}

	update(dt: number, frameDelta: number) {
		this.queries.bodies.forEach(entity => {
			const position = entity.get(Transform).position;
			const collider = entity.get(ArcadeCollisionShape);

			position.x = MathHelper.lerp(position.x, collider.shape.pos.x, frameDelta);
			position.y = MathHelper.lerp(position.y, collider.shape.pos.y, frameDelta);
		});
	}
}
