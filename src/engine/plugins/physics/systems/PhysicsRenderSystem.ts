import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { makeQuery } from '@ecs/utils/QueryHelper';
import { World } from 'p2';
import { Engine } from '@ecs/ecs/Engine';
import PhysicsSystem from './PhysicsSystem';
import { Graphics } from 'pixi.js';
import Color from '@ecs/math/Color';

export default class PhysicsDebugSystem extends IterativeSystem {
	protected world: World;
	protected graphics: Graphics;

	constructor(engine: Engine) {
		super(makeQuery());

		const physicsSystem = engine.getSystem(PhysicsSystem);
		if (!physicsSystem) {
			throw new Error('no physics system in engine');
		}

		this.world = physicsSystem.world;

		this.graphics = new Graphics();

		const entity = new Entity();
		entity.add(this.graphics);
		engine.addEntity(entity);
	}

	public update(dt: number) {
		super.update(dt);

		this.graphics.clear();

		this.graphics.beginFill(0, 0.3);
		this.graphics.lineStyle(0, Color.Black, 0.8);

		for (const body of this.world.bodies) {
			for (const shape of body.shapes) {
				// shape.
				// if(staticObj.shape instanceof SAT.Polygon) {
				// 	const points = staticObj.shape.points.map((a) => new PIXI.Point(staticObj.shape.pos.x + a.x, staticObj.shape.pos.y + a.y));
				// 	points.push(points[0]);
				// 	this.graphics.drawPolygon(points);
				// }
				// if(staticObj instanceof SAT.Circle) {
				// 	this.graphics.drawCircle(staticObj.pos.x, staticObj.pos.y, staticObj.r);
				// }
			}
		}
	}
}
