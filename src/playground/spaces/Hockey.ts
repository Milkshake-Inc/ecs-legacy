import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { Query } from '@ecs/ecs/Query';
import MathHelper from '@ecs/math/MathHelper';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';
import Position from '@ecs/plugins/Position';
import Space from '@ecs/plugins/space/Space';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import Moveable from '../components/Moveable';
import { Paddle } from '../components/Paddle';
import { Puck } from '../components/Puck';
import Score from '../components/Score';
import { Wall } from '../components/Wall';
import MovementSystem from '../systems/MovementSystem';

// http://www.iforce2d.net/b2dtut/collision-filtering
export enum CollisionCategory {
	Wall = 1,
	Goal,
	Player,
	Puck
}

export enum PlayerColor {
	Red,
	Blue
}

export type SnapshotEntity = {
	position: { x: number; y: number };
	velocity: { x: number; y: number };
};

export type PaddleSnapshotEntity = SnapshotEntity & {
	sessionId: string;
	color: PlayerColor;
};

export type Snapshot = {
	paddles: PaddleSnapshotEntity[];
	puck: SnapshotEntity;
	scores: {
		red: number;
		blue: number;
	};
};

export const PlayerConfig = [
	{
		spawnPoint: { x: 100, y: 720 / 2 },
		color: PlayerColor.Red
	},
	{
		spawnPoint: { x: 1280 - 100, y: 720 / 2 },
		color: PlayerColor.Blue
	}
];

export default class Hockey extends Space {
	protected paddleQuery: Query;
	protected scoreQuery: Query;

	protected puck: Entity;

	constructor(engine: Engine) {
		super(engine, 'hockey');

		this.paddleQuery = makeQuery(all(Paddle));
		engine.addQuery(this.paddleQuery);

		this.scoreQuery = makeQuery(all(Score));
		engine.addQuery(this.scoreQuery);
	}

	setup() {
		this.addSystem(new MovementSystem());
		this.addSystem(new PhysicsSystem({ x: 0, y: 0, scale: 0 }));

		this.puck = this.createPuck();

		this.addEntity(new Entity().add(Score));

		this.addEntities(this.puck, ...this.createWalls());
	}

	createPaddle(entity: Entity, player: PlayerColor, spawnPosition: { x: number; y: number }) {
		entity.add(Position, spawnPosition);
		entity.add(Moveable, { speed: 0.05 });
		entity.add(Paddle, { color: player });
		entity.add(
			PhysicsBody.circle(65, {
				mass: 10,
				frictionAir: 0.1,
				inertia: Infinity,
				collisionFilter: { category: CollisionCategory.Player }
			})
		);
	}

	createPuck(): Entity {
		const puck = new Entity();
		puck.add(Position, { x: 1280 / 2, y: 720 / 2 });
		puck.add(
			PhysicsBody.circle(40, {
				mass: 1,
				restitution: 0.9,
				frictionAir: 0.005,
				inertia: Infinity,
				collisionFilter: { category: CollisionCategory.Puck, mask: CollisionCategory.Wall | CollisionCategory.Player }
			})
		);
		puck.add(Puck);
		return puck;
	}

	createWalls(): Entity[] {
		const top = this.createWall(1280 / 2, 10 / 2, 1280, 10);
		const bottom = this.createWall(1280 / 2, 720 - 10 / 2, 1280, 10);
		const rightTop = this.createWall(1280 - 5, 192 / 2, 10, 192);
		const rightBottom = this.createWall(1280 - 5, 720 - 192 / 2, 10, 192);
		const leftTop = this.createWall(5, 192 / 2, 10, 192);
		const leftBottom = this.createWall(5, 720 - 192 / 2, 10, 192);

		const rightGoal = this.createGoal(1280 - 5, 192 + 336 / 2);
		const leftGoal = this.createGoal(5, 192 + 336 / 2);

		const dist = 30;

		const topLeftCorner = this.createCorner(dist, dist, 180);
		const topRightCorner = this.createCorner(1280 - dist, dist, 270);
		const bottomRightCorner = this.createCorner(1280 - dist, 720 - dist, 0);
		const bottomLeftCorner = this.createCorner(dist, 720 - dist, 90);

		return [
			top,
			bottom,
			rightTop,
			rightBottom,
			leftTop,
			leftBottom,
			leftGoal,
			rightGoal,
			topLeftCorner,
			topRightCorner,
			bottomRightCorner,
			bottomLeftCorner
		];
	}

	createCorner(x: number, y: number, rotation = 0, angle = 90, size = 100, amount = 10) {
		const anglePerAmount = angle / amount;

		const points = [];

		const halfAngle = angle / 2;

		for (let index = 0; index < amount + 1; index++) {
			points.push({
				x: Math.cos(MathHelper.toRadians(rotation + index * anglePerAmount)) * size,
				y: Math.sin(MathHelper.toRadians(rotation + index * anglePerAmount)) * size
			});
		}

		points.push({
			x: Math.cos(MathHelper.toRadians(rotation + halfAngle)) * (size * 1.5),
			y: Math.sin(MathHelper.toRadians(rotation + halfAngle)) * (size * 1.5)
		});

		return new Entity()
			.add(Position, { x, y })
			.add(Wall)
			.add(
				PhysicsBody.fromVertices(points, {
					isStatic: true,
					collisionFilter: { category: CollisionCategory.Wall, mask: CollisionCategory.Player | CollisionCategory.Puck }
				})
			);
	}

	createWall(x: number, y: number, width: number, height): Entity {
		const wall = new Entity();
		wall.add(Position, { x, y });
		wall.add(
			PhysicsBody.rectangle(width, height, {
				isStatic: true,
				collisionFilter: { category: CollisionCategory.Wall, mask: CollisionCategory.Player | CollisionCategory.Puck }
			})
		);
		wall.add(Wall);
		return wall;
	}

	createGoal(x: number, y: number): Entity {
		const goal = new Entity();
		goal.add(Position, { x, y });
		goal.add(
			PhysicsBody.rectangle(10, 336, {
				isStatic: true,
				collisionFilter: { category: CollisionCategory.Goal, mask: CollisionCategory.Player }
			})
		);

		return goal;
	}
}
