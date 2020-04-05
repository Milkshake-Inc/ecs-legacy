import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { World, Body, Shape, Circle, WorldOptions } from 'p2';

export default class PhysicsSystem extends IterativeSystem {
	protected world: World;

	constructor(config: WorldOptions = { gravity: [0, 0] }) {
		super(makeQuery(all(Position, Body), any(Circle)));

		this.world = new World(config);
	}

	protected updateEntityFixed(entity: Entity): void {
		const body = entity.get(Body);
		const position = entity.get(Position);

		position.x = body.position[0];
		position.y = body.position[1];
	}

	entityAdded = (snapshot: EntitySnapshot) => {
		const body = snapshot.get(Body);
		const position = snapshot.get(Position);
		body.position[0] = position.x;
		body.position[1] = position.y;
		this.world.addBody(snapshot.get(Body));

		if (snapshot.has(Shape)) {
			const body = snapshot.get(Body);
			body.addShape(snapshot.get(Shape));
		}

		if (snapshot.has(Circle)) {
			const body = snapshot.get(Body);
			body.addShape(snapshot.get(Circle));
		}
	};

	entityRemoved = (snapshot: EntitySnapshot) => {
		this.world.removeBody(snapshot.get(Body));
		snapshot.get(Body).shapes = [];
	};

	public updateFixed(dt: number) {
		super.updateFixed(dt);

		this.world.step(dt);
	}
}
