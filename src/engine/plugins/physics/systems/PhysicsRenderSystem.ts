import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { makeQuery } from '@ecs/utils/QueryHelper';
import { Engine } from '@ecs/ecs/Engine';
import PhysicsSystem from './PhysicsSystem';
import { Graphics } from 'pixi.js';
import Color from '@ecs/math/Color';
import Position from '@ecs/plugins/Position';
import { World } from 'matter-js';

export const Options = {
	zIndex: 7,
	alpha: 0.5,
	wireFrames: false,
	showAngleIndicator: true,
	showAxes: true,

	fillStyle: Color.Magenta,
	lineWidth: 3,
	strokeStyle: Color.LimeGreen,

	wireFrameLineWidth: 1,
	wireFrameStrokeStyle: Color.LimeGreen
};

export default class PhysicsRenderSystem extends IterativeSystem {
	protected world: World;
	protected graphics: Graphics;

	constructor() {
		super(makeQuery());
	}

	onAddedToEngine(engine: Engine) {
		const physicsSystem = engine.getSystem(PhysicsSystem);
		if (!physicsSystem) {
			throw new Error('no physics system in engine');
		}

		this.world = physicsSystem.world;

		this.graphics = new Graphics();
		this.graphics.zIndex = Options.zIndex;
		this.graphics.alpha = Options.alpha;

		const entity = new Entity();
		entity.add(Position);
		entity.add(this.graphics);
		engine.addEntity(entity);
	}

	public update(dt: number) {
		super.update(dt);

		this.graphics.clear();

		for (const body of this.world.bodies) {
			for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
				const part = body.parts[k];

				if (Options.wireFrames) {
					this.graphics.beginFill(0, 0);
					this.graphics.lineStyle(Options.wireFrameLineWidth, Options.wireFrameStrokeStyle);
				} else {
					this.graphics.beginFill(Options.fillStyle);
					this.graphics.lineStyle(Options.lineWidth, Options.strokeStyle);
				}

				this.graphics.moveTo(part.vertices[0].x, part.vertices[0].y);

				for (let j = 1; j < part.vertices.length; j++) {
					this.graphics.lineTo(part.vertices[j].x, part.vertices[j].y);
				}

				this.graphics.lineTo(part.vertices[0].x, part.vertices[0].y);

				this.graphics.endFill();

				// angle indicator
				if (Options.showAngleIndicator || Options.showAxes) {
					this.graphics.beginFill(0, 0);

					if (Options.wireFrames) {
						this.graphics.lineStyle(Options.wireFrameLineWidth, Options.wireFrameStrokeStyle);
					} else {
						this.graphics.lineStyle(Options.lineWidth, Options.strokeStyle);
					}

					this.graphics.moveTo(part.position.x, part.position.y);
					this.graphics.lineTo(
						(part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2,
						(part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2
					);

					this.graphics.endFill();
				}
			}
		}
	}
}
