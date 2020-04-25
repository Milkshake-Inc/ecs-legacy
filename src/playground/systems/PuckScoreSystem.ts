import { Entity } from '@ecs/ecs/Entity';
import { useQueries, useState } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Random from '@ecs/math/Random';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { Paddle } from '../components/Paddle';
import { Puck } from '../components/Puck';
import Score from '../components/Score';

export default class PuckScoreSystem extends IterativeSystem {
	protected bounds: { width: number; height: number };
	protected padding: number;
	protected spawnVelocity: number;

	protected queries = useQueries(this, {
		paddles: all(Paddle)
	});

	protected state = useState(this, new Score());

	constructor(bounds: { width: number; height: number }, padding = 50, spawnVelocity = 0.5) {
		super(makeQuery(all(Position, PhysicsBody, Puck)));

		this.bounds = bounds;
		this.padding = padding;
		this.spawnVelocity = spawnVelocity;
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		const position = entity.get(Position);

		const score = this.state;
		const serverEmpty = this.queries.paddles.entities.length == 0;
		const canScore = this.queries.paddles.entities.length > 0;

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
			this.resetScore();
			this.resetPuck(entity);
			console.log('No players - reset score');
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

	private resetScore() {
		this.state.red = 0;
		this.state.blue = 0;
	}
}
