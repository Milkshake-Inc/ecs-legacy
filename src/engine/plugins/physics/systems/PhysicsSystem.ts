import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { World, Body, Shape, Circle, Box, WorldOptions } from 'p2';

export default class PhysicsSystem extends IterativeSystem {
	public readonly world: World;

	constructor(config: WorldOptions = { gravity: [0, 0] }) {
		super(makeQuery(all(Position, Body), any(Circle, Box)));

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

		if (snapshot.has(Box)) {
			const body = snapshot.get(Body);
			body.addShape(snapshot.get(Box));
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
