import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { Body, Engine, Events, World } from 'matter-js';
import PhysicsBody from '../components/PhysicsBody';
import { CollisionEvent } from './PhysicsCollisionSystem';

export default class PhysicsSystem extends IterativeSystem {
	public readonly engine: Engine;
	public readonly world: World;

	constructor(gravity = { x: 0, y: 1, scale: 0.001 }) {
		super(makeQuery(all(Position, PhysicsBody)));

		this.engine = Engine.create();
		this.world = this.engine.world;
		this.world.gravity = gravity;

		Events.on(this.engine, 'collisionStart', event => {
			event.pairs.forEach(pair => {
				const entityA = this.entityFromBody(pair.bodyA);
				const entityB = this.entityFromBody(pair.bodyB);

				entityA.get(PhysicsBody).collisions.push(new CollisionEvent(entityA, entityB));
				entityB.get(PhysicsBody).collisions.push(new CollisionEvent(entityB, entityA));
			});
		});
	}

	private entityFromBody(body: Body): Entity {
		return this.entities.find(entity => entity.get(PhysicsBody).body == body);
	}

	protected updateEntityFixed(entity: Entity): void {
		const physicsBody = entity.get(PhysicsBody);
		const position = entity.get(Position);

		physicsBody.collisions = [];

		position.x = physicsBody.body.position.x;
		position.y = physicsBody.body.position.y;
	}

	entityAdded = (snapshot: EntitySnapshot) => {
		const body = snapshot.get(PhysicsBody);
		const position = snapshot.get(Position);

		body.position = {
			x: position.x,
			y: position.y
		};

		World.addBody(this.world, snapshot.get(PhysicsBody).body);
	};

	entityRemoved = (snapshot: EntitySnapshot) => {
		World.remove(this.world, snapshot.get(PhysicsBody).body);
	};

	public updateFixed(dt: number) {
		super.updateFixed(dt);
		Engine.update(this.engine, dt);
	}
}
