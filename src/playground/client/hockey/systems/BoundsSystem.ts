import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import BoundingBox from '../components/BoundingBox';
import BoundingCircle from '../components/BoundingCircle';
import { Body } from 'p2';

export default class BoundsSystem extends IterativeSystem {
	constructor(protected bounds: { width: number; height: number }) {
		super(makeQuery(all(Position, Body), any(BoundingBox, BoundingCircle)));
	}

	protected updateEntity(entity: Entity, dt: number) {
		const position = entity.get(Position);
		const body = entity.get(Body);

		const boundsComponent = entity.has(BoundingBox) ? entity.get(BoundingBox) : entity.get(BoundingCircle);

		const boundsWidth = boundsComponent instanceof BoundingBox ? boundsComponent.size.x : boundsComponent.size;
		const boundsHeight = boundsComponent instanceof BoundingBox ? boundsComponent.size.y : boundsComponent.size;

		// Left
		if (position.x - boundsWidth / 2 < 0) {
			body.position[0] = boundsWidth / 2;
		}

		// Right
		if (position.x + boundsWidth / 2 > this.bounds.width) {
			body.position[0] = this.bounds.width - boundsWidth / 2;
		}

		// Top
		if (position.y - boundsHeight / 2 < 0) {
			body.position[1] = boundsHeight / 2;
		}

		// Bottom
		if (position.y + boundsHeight / 2 > this.bounds.height) {
			body.position[1] = this.bounds.height - boundsHeight / 2;
		}
	}
}
