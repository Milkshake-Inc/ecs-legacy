import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { World, Engine, Body } from 'matter-js';
import PhysicsBody from '../components/PhysicsBody';

export default class PhysicsSystem extends IterativeSystem {
	public readonly engine: Engine;
	public readonly world: World;

	constructor(gravity = { x: 0, y: 1, scale: 0.001 }) {
		super(makeQuery(all(Position, PhysicsBody)));

		this.engine = Engine.create();
		this.world = this.engine.world;
		this.world.gravity = gravity;
	}

	protected updateEntityFixed(entity: Entity): void {
		const { body } = entity.get(PhysicsBody);
		const position = entity.get(Position);

		position.x = body.position.x;
		position.y = body.position.y;
	}

	entityAdded = (snapshot: EntitySnapshot) => {
		const { body } = snapshot.get(PhysicsBody);
		const position = snapshot.get(Position);

		Body.setPosition(body, {
			x: position.x,
			y: position.y
		});

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
