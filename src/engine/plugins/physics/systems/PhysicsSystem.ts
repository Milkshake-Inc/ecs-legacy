import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { Body, Engine, Events, World } from 'matter-js';
import PhysicsBody from '../components/PhysicsBody';
import { CollisionEvent } from './PhysicsCollisionSystem';
import { injectPolyDecomp } from '../utils/PhysicsUtils';

injectPolyDecomp();

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

	public updateFixed(dt: number) {
		this.clearCollisions();

		Engine.update(this.engine, dt);

		super.updateFixed(dt);
	}

	protected updateEntityFixed(entity: Entity): void {
		const physicsBody = entity.get(PhysicsBody);
		const position = entity.get(Position);

		position.x = physicsBody.body.position.x;
		position.y = physicsBody.body.position.y;
	}

	private entityFromBody(body: Body): Entity {
		return this.entities.find(entity => {
			const physicsBody = entity.get(PhysicsBody);

			return physicsBody.body == body || physicsBody.parts.includes(body);
		});
	}

	private clearCollisions() {
		this.entities.forEach(entity => {
			entity.get(PhysicsBody).collisions = [];
		});
	}

	entityAdded = ({ entity }: EntitySnapshot) => {
		const body = entity.get(PhysicsBody);
		const position = entity.get(Position);

		body.position = {
			x: position.x,
			y: position.y
		};

		const alreadyHaveBody = this.world.bodies.includes(entity.get(PhysicsBody).body);

		if (alreadyHaveBody) {
			console.warn('Tried adding body twice');
		}

		World.addBody(this.world, entity.get(PhysicsBody).body);
	};

	entityRemoved = (snapshot: EntitySnapshot) => {
		World.remove(this.world, snapshot.get(PhysicsBody).body);
	};
}
