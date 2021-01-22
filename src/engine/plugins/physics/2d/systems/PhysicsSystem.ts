import { Entity, System, all, EntitySnapshot } from 'tick-knock';
import Transform from '@ecs/plugins/math/Transform';
import { Body, Engine, Events, World } from 'matter-js';
import PhysicsBody from '../components/PhysicsBody';
import { CollisionEvent } from './PhysicsCollisionSystem';
import { injectPolyDecomp } from '../utils/PhysicsUtils';
import { useQueries } from '@ecs/core/helpers';

injectPolyDecomp();

export default class PhysicsSystem extends System {
	static engineUpdate(dt: number) {
		Engine.update(this.physicsEngine, dt);
	}

	static updateEntityFixed(entity: Entity, dt: number) {
		const physicsBody = entity.get(PhysicsBody);
		const position = entity.get(Transform).position;

		position.x = physicsBody.body.position.x;
		position.y = physicsBody.body.position.y;
	}

	public static physicsEngine: Engine;

	public readonly physicsEngine: Engine;
	public readonly world: World;

	protected queries = useQueries(this, {
		bodies: all(Transform, PhysicsBody)
	});

	constructor(gravity = { x: 0, y: 1, scale: 0.001 }) {
		super();

		this.physicsEngine = Engine.create();

		// HACK
		PhysicsSystem.physicsEngine = this.physicsEngine;

		this.world = this.physicsEngine.world;
		this.world.gravity = gravity;

		Events.on(this.physicsEngine, 'collisionStart', event => {
			event.pairs.forEach(pair => {
				const entityA = this.entityFromBody(pair.bodyA);
				const entityB = this.entityFromBody(pair.bodyB);

				entityA.get(PhysicsBody).collisions.push(new CollisionEvent(entityA, entityB));
				entityB.get(PhysicsBody).collisions.push(new CollisionEvent(entityB, entityA));
			});
		});

		this.queries.bodies.onEntityAdded.connect(entity => this.onBodyAdded(entity));
		this.queries.bodies.onEntityRemoved.connect(entity => this.onBodyRemoved(entity));
	}

	public updateFixed(dt: number) {
		this.clearCollisions();

		// console.log("update phsycis")
		Engine.update(this.physicsEngine, dt, 1);

		super.updateFixed(dt);
	}

	protected updateEntityFixed(entity: Entity): void {
		const physicsBody = entity.get(PhysicsBody);
		const position = entity.get(Transform);

		position.x = physicsBody.body.position.x;
		position.y = physicsBody.body.position.y;
	}

	private entityFromBody(body: Body): Entity {
		return this.queries.bodies.find(entity => {
			const physicsBody = entity.get(PhysicsBody);

			return physicsBody.body == body || physicsBody.parts.includes(body);
		});
	}

	private clearCollisions() {
		this.queries.bodies.forEach(entity => {
			entity.get(PhysicsBody).collisions = [];
		});
	}

	private onBodyAdded(entity: EntitySnapshot) {
		const body = entity.get(PhysicsBody);
		const position = entity.get(Transform);

		body.position = {
			x: position.x,
			y: position.y
		};

		const alreadyHaveBody = this.world.bodies.includes(entity.get(PhysicsBody).body);

		if (alreadyHaveBody) {
			console.warn('Tried adding body twice');
		}

		World.addBody(this.world, entity.get(PhysicsBody).body);
	}

	private onBodyRemoved(entity: EntitySnapshot) {
		World.remove(this.world, entity.get(PhysicsBody).body);
	}
}
