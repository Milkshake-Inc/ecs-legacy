import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { makeQuery } from '@ecs/utils/QueryHelper';
import { World, Box, Circle } from 'p2';
import { Engine } from '@ecs/ecs/Engine';
import PhysicsSystem from './PhysicsSystem';
import { Graphics } from 'pixi.js';
import Color from '@ecs/math/Color';
import Position from '@ecs/plugins/Position';

export default class PhysicsRenderSystem extends IterativeSystem {
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
		entity.addComponent(Position);
		entity.add(this.graphics);
		engine.addEntity(entity);
	}

	public update(dt: number) {
		super.update(dt);

		this.graphics.clear();
		this.graphics.beginFill(Color.Blue, 0.5);
		this.graphics.lineStyle(2, Color.Green, 0.8);

		for (const body of this.world.bodies) {
			for (const shape of body.shapes) {
				if (shape instanceof Box) {
					this.graphics.drawRect(
						body.position[0] - shape.width / 2,
						body.position[1] - shape.height / 2,
						shape.width,
						shape.height
					);
				}

				if (shape instanceof Circle) {
					this.graphics.drawCircle(body.position[0], body.position[1], shape.radius);
				}
			}
		}
	}
}
