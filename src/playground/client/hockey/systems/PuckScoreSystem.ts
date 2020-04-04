import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Random from '@ecs/math/Random';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import Physics from '../components/Physics';
import { Puck } from '../components/Puck';
import Score from '../components/Score';

export default class PuckScoreSystem extends IterativeSystem {
	protected bounds: { width: number; height: number };
	protected padding: number;
	protected spawnVelocity: number;

	constructor(bounds: { width: number; height: number }, padding = 50, spawnVelocity = 0.5) {
		super(makeQuery(all(Position, Physics, Puck, Score)));

		this.bounds = bounds;
		this.padding = padding;
		this.spawnVelocity = spawnVelocity;
	}

	protected updateEntity(entity: Entity, dt: number) {
		const position = entity.get(Position);
		const score = entity.get(Score);

		if (position.x > this.bounds.width + this.padding) {
			score.red++;
			this.resetPuck(entity);
		}
		if (position.x < 0 - this.padding) {
			score.blue++;
			this.resetPuck(entity);
		}

		if (position.y < 0 || position.y > this.bounds.height) {
			this.resetPuck(entity);
		}
	}

	private resetPuck(entity: Entity) {
		const position = entity.get(Position);
		const physics = entity.get(Physics);

		position.x = this.bounds.width / 2;
		position.y = this.bounds.height / 2;

		physics.velocity.x = Random.bool() ? -this.spawnVelocity : this.spawnVelocity;
		physics.velocity.y = Random.bool() ? -this.spawnVelocity : this.spawnVelocity;
	}
}
