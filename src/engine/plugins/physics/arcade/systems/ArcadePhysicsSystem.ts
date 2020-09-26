import { Entity, EntitySnapshot } from '@ecs/core/Entity';
import { IterativeSystem } from '@ecs/core/IterativeSystem';
import { QueryBuilder } from '@ecs/core/Query';
import MathHelper from '@ecs/plugins/math/MathHelper';
import Transform from '@ecs/plugins/math/Transform';
import { ArcadeCollisionShape } from '../components/ArcadeCollisionShape';
import ArcadePhysics from '../components/ArcadePhysics';

export default class ArcadePhysicsSystem extends IterativeSystem {
	constructor() {
		super(new QueryBuilder().contains(Transform, ArcadePhysics).build());
	}

	entityAdded = (entitySnapshot: EntitySnapshot) => {
		const transfrom = entitySnapshot.entity.get(Transform);
		const shape = entitySnapshot.entity.get(ArcadeCollisionShape);

		shape.shape.pos.x = transfrom.x;
		shape.shape.pos.y = transfrom.y;
	};

	protected updateEntityFixed(entity: Entity, dt: number) {
		const collider = entity.get(ArcadeCollisionShape);
		const physics = entity.get(ArcadePhysics);

		collider.shape.pos.x += physics.velocity.x * dt;
		collider.shape.pos.y += physics.velocity.y * dt;

		physics.velocity.x *= physics.friction;
		physics.velocity.y *= physics.friction;

		if (physics.velocity.x > physics.maxVelocity) physics.velocity.x = physics.maxVelocity;
		if (physics.velocity.y > physics.maxVelocity) physics.velocity.y = physics.maxVelocity;
	}

	protected updateEntity(entity: Entity, dt: number, frameDelta: number) {
		const position = entity.get(Transform).position;
		const collider = entity.get(ArcadeCollisionShape);

		position.x = MathHelper.lerp(position.x, collider.shape.pos.x, frameDelta);
		position.y = MathHelper.lerp(position.y, collider.shape.pos.y, frameDelta);
	}
}
