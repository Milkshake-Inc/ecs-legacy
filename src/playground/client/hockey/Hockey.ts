import { Entity } from '@ecs/ecs/Entity';
import Vector2 from '@ecs/math/Vector2';
import Input from '@ecs/plugins/input/components/Input';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Position from '@ecs/plugins/Position';
import Sprite from '@ecs/plugins/render/components/Sprite';
import Space from '@ecs/plugins/space/Space';
import { LoadPixiAssets } from '@ecs/utils/PixiHelper';
import Moveable from './components/Moveable';
import MovementSystem from './systems/MovementSystem';
import PuckScoreSystem from './systems/PuckScoreSystem';
import { Puck } from './components/Puck';
import BitmapText from '@ecs/plugins/render/components/BitmapText';
import Color from '@ecs/math/Color';
import Score from './components/Score';
import HudSystem, { Hud } from './systems/HudSystem';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';
import PhysicsRenderSystem from '@ecs/plugins/physics/systems/PhysicsRenderSystem';
import { Bodies } from 'matter-js';
import { PhysicsBody } from '@ecs/plugins/physics/components/PhysicsBody';
// import { PhysicsBody } from '@ecs/plugins/physics/components/PhysicsBody';

const Assets = {
	Background: 'assets/hockey/background.png',
	RedPaddle: 'assets/hockey/red.png',
	BluePaddle: 'assets/hockey/blue.png',
	Puck: 'assets/hockey/puck.png'
};

export default class Hockey extends Space {
	private score: Score;

	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		this.addSystem(new InputSystem());
		this.addSystem(new MovementSystem());
		this.addSystem(new PhysicsSystem());
		this.addSystem(new PhysicsRenderSystem(this));
		this.addSystem(new PuckScoreSystem({ width: 1280, height: 720 }));

		const background = new Entity();
		background.addComponent(Position);
		background.addComponent(Sprite, { imageUrl: Assets.Background, anchor: Vector2.ZERO });

		const redPaddle = this.createPaddle(Assets.RedPaddle, Input.WASD(), { x: 100, y: 720 / 2 });
		const bluePaddle = this.createPaddle(Assets.BluePaddle, Input.ARROW(), { x: 1280 - 100, y: 720 / 2 });

		const puck = new Entity();
		puck.addComponent(Position, { x: 1280 / 2, y: 720 / 2 });
		puck.addComponent(Sprite, { imageUrl: Assets.Puck });
		puck.addComponent(PhysicsBody, { body: Bodies.circle(0, 0, 40, { mass: 1, restitution: 0.9 }) });
		puck.addComponent(Puck);
		puck.add((this.score = new Score()));

		const hud = this.hud();
		this.addSystem(new HudSystem(hud));

		this.addEntities(background, redPaddle, bluePaddle, puck, ...this.createWalls(), hud.redScore, hud.blueScore);
	}

	createPaddle(asset: string, input: Input, spawnPosition: { x: number; y: number }) {
		const paddle = new Entity();
		paddle.addComponent(Position, { x: spawnPosition.x, y: spawnPosition.y });
		paddle.addComponent(Sprite, { imageUrl: asset });
		paddle.add(input);
		paddle.addComponent(Moveable, { speed: 0.05 });
		paddle.addComponent(Score);
		paddle.addComponent(PhysicsBody, { body: Bodies.circle(spawnPosition.x, spawnPosition.y, 65, { mass: 10, frictionAir: 0.1 }) });

		return paddle;
	}

	createWalls(): Entity[] {
		const top = new Entity();
		top.addComponent(Position, { x: 1280 / 2, y: 10 / 2 });
		top.addComponent(PhysicsBody, { body: Bodies.rectangle(0, 0, 1280, 10, { isStatic: true }) });

		const bottom = new Entity();
		bottom.addComponent(Position, { x: 1280 / 2, y: 720 - 10 / 2 });
		bottom.addComponent(PhysicsBody, { body: Bodies.rectangle(0, 0, 1280, 10, { isStatic: true }) });

		const rightTop = new Entity();
		rightTop.addComponent(Position, { x: 1280 - 5, y: 192 / 2 });
		rightTop.addComponent(PhysicsBody, { body: Bodies.rectangle(0, 0, 10, 192, { isStatic: true }) });

		const rightBottom = new Entity();
		rightBottom.addComponent(Position, { x: 1280 - 10, y: 720 - 192 / 2 });
		rightBottom.addComponent(PhysicsBody, { body: Bodies.rectangle(0, 0, 10, 192, { isStatic: true }) });

		const leftTop = new Entity();
		leftTop.addComponent(Position, { x: 5, y: 192 / 2 });
		leftTop.addComponent(PhysicsBody, { body: Bodies.rectangle(0, 0, 10, 192, { isStatic: true }) });

		const leftBottom = new Entity();
		leftBottom.addComponent(Position, { x: 5, y: 720 - 192 / 2 });
		leftBottom.addComponent(PhysicsBody, { body: Bodies.rectangle(0, 0, 10, 192, { isStatic: true }) });

		return [top, bottom, rightTop, rightBottom, leftTop, leftBottom];
	}

	hud(): Hud {
		const redScore = new Entity();
		redScore.addComponent(Position, { x: 50, y: 50 });
		redScore.addComponent(BitmapText, { text: '0', tint: Color.Red, size: 50 });

		const blueScore = new Entity();
		blueScore.addComponent(Position, { x: 1280 - 80, y: 50 });
		blueScore.addComponent(BitmapText, { text: '0', tint: Color.Blue, size: 50 });

		return { redScore, blueScore };
	}
}
