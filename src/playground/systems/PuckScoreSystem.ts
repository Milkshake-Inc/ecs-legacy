import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Random from '@ecs/math/Random';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { Puck } from '../components/Puck';
import Score from '../components/Score';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import { Engine } from '@ecs/ecs/Engine';
import { Query } from '@ecs/ecs/Query';
import { Paddle } from '../components/Paddle';

export default class PuckScoreSystem extends IterativeSystem {
	protected scoreQuery: Query;
	protected paddlesQuery: Query;

	protected bounds: { width: number; height: number };
	protected padding: number;
	protected spawnVelocity: number;

	constructor(engine: Engine, bounds: { width: number; height: number }, padding = 50, spawnVelocity = 0.5) {
		super(makeQuery(all(Position, PhysicsBody, Puck)));

		// On added to engine better?
		this.scoreQuery = makeQuery(all(Score));
		engine.addQuery(this.scoreQuery);

		this.paddlesQuery = makeQuery(all(Paddle));
		engine.addQuery(this.paddlesQuery);

		this.bounds = bounds;
		this.padding = padding;
		this.spawnVelocity = spawnVelocity;
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		const position = entity.get(Position);

		const score = this.scoreQuery.entities[0].get(Score);
		const serverEmpty = this.paddlesQuery.entities.length == 0;
		const canScore = this.paddlesQuery.entities.length > 1;

		if (position.x > this.bounds.width + this.padding) {
			if (canScore) score.red++;
			this.resetPuck(entity);
		}
		if (position.x < 0 - this.padding) {
			if (canScore) score.blue++;
			this.resetPuck(entity);
		}

		if (position.y < 0 || position.y > this.bounds.height) {
			this.resetPuck(entity);
		}

		if (serverEmpty && (score.blue != 0 || score.red != 0)) {
			score.blue = 0;
			score.red = 0;
			console.log('No players reseting');
		}
	}

	private resetPuck(entity: Entity) {
		const body = entity.get(PhysicsBody);

		body.position = {
			x: this.bounds.width / 2,
			y: this.bounds.height / 2
		};

		body.velocity = {
			x: Random.bool() ? -this.spawnVelocity : this.spawnVelocity,
			y: Random.bool() ? -this.spawnVelocity : this.spawnVelocity
		};
	}
}
