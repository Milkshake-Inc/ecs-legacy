import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Random from '@ecs/math/Random';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { Puck } from '../components/Puck';
import Score from '../components/Score';
import { Body } from 'p2';

export default class PuckScoreSystem extends IterativeSystem {
	protected bounds: { width: number; height: number };
	protected padding: number;
	protected spawnVelocity: number;

	constructor(bounds: { width: number; height: number }, padding = 50, spawnVelocity = 0.5) {
		super(makeQuery(all(Position, Body, Puck, Score)));

		this.bounds = bounds;
		this.padding = padding;
		this.spawnVelocity = spawnVelocity;
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
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
		const body = entity.get(Body);

		body.position[0] = this.bounds.width / 2;
		body.position[1] = this.bounds.height / 2;

		body.velocity[0] = Random.bool() ? -this.spawnVelocity : this.spawnVelocity;
		body.velocity[1] = Random.bool() ? -this.spawnVelocity : this.spawnVelocity;
	}
}
