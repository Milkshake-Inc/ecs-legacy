import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { Query } from '@ecs/ecs/Query';
import MathHelper from '@ecs/math/MathHelper';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';
import Transform from '@ecs/plugins/Transform';
import Space from '@ecs/plugins/space/Space';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import Moveable from '../components/Moveable';
import { Paddle } from '../components/Paddle';
import { Puck } from '../components/Puck';
import Score from '../components/Score';
import { Wall } from '../components/Wall';
import MovementSystem from '../systems/MovementSystem';
import { Name } from '../components/Name';
import { Player } from '../components/Player';
import Input from '@ecs/plugins/input/components/Input';
import Session from '@ecs/plugins/net/components/Session';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';

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

export type SnapshotPhysicsEntity = {
	position: { x: number; y: number };
	velocity: { x: number; y: number };
};

export type PaddleSnapshotEntity = SnapshotPhysicsEntity & {
	sessionId: string;
	name: string;
	color: PlayerColor;
	input: Input;
};

export type Snapshot = {
	paddles: PaddleSnapshotEntity[];
	puck: SnapshotPhysicsEntity;
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

export const generateSnapshotQueries = {
	sessions: makeQuery(all(Session)),
	paddles: makeQuery(all(Paddle)),
	puck: makeQuery(all(Puck)),
	score: makeQuery(all(Score))
};

export const applySnapshot = (queries: typeof generateSnapshotQueries, snapshot: Snapshot) => {
	const applyEntitySnapshot = (entity: Entity, snapshot: SnapshotPhysicsEntity) => {
		const physics = entity.get(PhysicsBody);

		physics.position = {
			x: snapshot.position.x,
			y: snapshot.position.y
		};

		physics.velocity = {
			x: snapshot.velocity.x,
			y: snapshot.velocity.y
		};
	};

	const getSessionId = (entity: Entity): string => {
		if (entity.has(Session)) {
			const session = entity.get(Session);
			return session.id;
		}

		if (entity.has(RemoteSession)) {
			const session = entity.get(RemoteSession);
			return session.id;
		}

		return '';
	};

	const findPaddleBySessionId = (findSessionId: string) =>
		queries.paddles.entities.find(entity => {
			const sessionId = getSessionId(entity);
			return sessionId == findSessionId;
		});

	applyEntitySnapshot(queries.puck.first, snapshot.puck);

	snapshot.paddles.forEach(paddleSnapshot => {
		const localPaddle = findPaddleBySessionId(paddleSnapshot.sessionId);
		// console.log("foUND");
		applyEntitySnapshot(localPaddle, paddleSnapshot);
		if (localPaddle.has(Input)) {
			Object.assign(localPaddle.get(Input), paddleSnapshot.input);
		}
	});
	// Hard part finding the entity?
	Object.assign(queries.score.first.get(Score), snapshot.scores);
};

export const takeSnapshot = (queries: typeof generateSnapshotQueries): Snapshot => {
	const entitySnapshot = (entity: Entity): SnapshotPhysicsEntity => {
		// const position = entity.get(Position);
		const physics = entity.get(PhysicsBody);
		// debugger;
		return {
			position: {
				x: physics.body.position.x,
				y: physics.body.position.y
			},
			velocity: {
				x: physics.body.velocity.x,
				y: physics.body.velocity.y
			}
		};
	};

	const paddleSnapshot = (entity: Entity): PaddleSnapshotEntity => {
		const session = entity.has(Session) ? entity.get(Session) : entity.get(RemoteSession); // Weird
		const paddle = entity.get(Paddle);
		const input = entity.get(Input);
		const name = entity.get(Name).name;
		const paddleSnap = entitySnapshot(entity);

		return {
			sessionId: session.id,
			name,
			color: paddle.color,
			...paddleSnap,
			input: { ...input }
		};
	};

	return {
		paddles: queries.paddles.entities.map(paddleSnapshot),
		puck: entitySnapshot(queries.puck.first),
		scores: queries.score.first.get(Score)
	};
};

export default class Hockey extends Space {
	protected paddleQuery: Query;
	protected scoreQuery: Query;

	protected puck: Entity;

	constructor(engine: Engine, open = false) {
		super(engine, open);

		this.paddleQuery = makeQuery(all(Paddle));
		engine.addQuery(this.paddleQuery);

		this.scoreQuery = makeQuery(all(Score));
		engine.addQuery(this.scoreQuery);
	}

	setup() {
		this.addSystem(new MovementSystem());
		this.addSystem(new PhysicsSystem({ x: 0, y: 0, scale: 0 }));

		this.puck = this.createPuck();

		this.addEntities(this.puck, ...this.createWalls());
	}

	createPaddle(entity: Entity, name: string, player: PlayerColor, spawnPosition: { x: number; y: number }) {
		entity.add(Transform, spawnPosition);
		entity.add(Moveable, { speed: 0.05 });
		entity.add(Paddle, { color: player });
		entity.add(Player);
		entity.add(Name, { name });
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
		puck.add(Transform, { x: 1280 / 2, y: 720 / 2 });
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
			.add(Transform, { x, y })
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
		wall.add(Transform, { x, y });
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
		goal.add(Transform, { x, y });
		goal.add(
			PhysicsBody.rectangle(10, 336, {
				isStatic: true,
				collisionFilter: { category: CollisionCategory.Goal, mask: CollisionCategory.Player }
			})
		);

		return goal;
	}
}
