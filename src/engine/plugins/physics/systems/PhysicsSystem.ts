import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { World } from 'matter-js';
import { Engine } from '@ecs/ecs/Engine';
import { PhysicsBody } from '../components/PhysicsBody';

export default class PhysicsSystem extends IterativeSystem {
	public readonly engine: Engine;
	public readonly world: World;

	constructor() {
		super(makeQuery(all(Position, PhysicsBody)));

		this.engine = new Engine();
		this.world = World.create({});
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

		body.position.x = position.x;
		body.position.y = position.y;

		World.addBody(this.world, snapshot.get(PhysicsBody).body);
	};

	entityRemoved = (snapshot: EntitySnapshot) => {
		World.remove(this.world, snapshot.get(PhysicsBody).body);
	};

	public updateFixed(dt: number) {
		super.updateFixed(dt);

		this.engine.update(dt);
	}
}
