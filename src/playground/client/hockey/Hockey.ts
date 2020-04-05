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
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';

const Assets = {
	Background: 'assets/hockey/background.png',
	RedPaddle: 'assets/hockey/red.png',
	BluePaddle: 'assets/hockey/blue.png',
	Puck: 'assets/hockey/puck.png'
};

// http://www.iforce2d.net/b2dtut/collision-filtering
enum CollisionCategory {
	Wall = 1,
	Goal,
	Player,
	Puck
}

export default class Hockey extends Space {
	private score: Score;

	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		this.addSystem(new InputSystem());
		this.addSystem(new MovementSystem());
		this.addSystem(new PhysicsSystem({ x: 0, y: 0, scale: 0 }));
		this.addSystem(new PhysicsRenderSystem(this));
		this.addSystem(new PuckScoreSystem({ width: 1280, height: 720 }));

		const background = new Entity();
		background.addComponent(Position);
		background.addComponent(Sprite, { imageUrl: Assets.Background, anchor: Vector2.ZERO });

		const redPaddle = this.createPaddle(Assets.RedPaddle, Input.WASD(), { x: 100, y: 720 / 2 });
		const bluePaddle = this.createPaddle(Assets.BluePaddle, Input.ARROW(), { x: 1280 - 100, y: 720 / 2 });

		const hud = this.hud();
		this.addSystem(new HudSystem(hud));

		this.addEntities(background, redPaddle, bluePaddle, this.createPuck(), ...this.createWalls(), hud.redScore, hud.blueScore);
	}

	createPaddle(asset: string, input: Input, spawnPosition: { x: number; y: number }): Entity {
		const paddle = new Entity();
		paddle.addComponent(Position, spawnPosition);
		paddle.addComponent(Sprite, { imageUrl: asset });
		paddle.add(input);
		paddle.addComponent(Moveable, { speed: 0.05 });
		paddle.addComponent(Score);
		paddle.addComponent(PhysicsBody, {
			body: PhysicsBody.circle(65, {
				mass: 10,
				frictionAir: 0.1,
				inertia: Infinity,
				collisionFilter: { category: CollisionCategory.Player }
			})
		});

		return paddle;
	}

	createPuck(): Entity {
		const puck = new Entity();
		puck.addComponent(Position, { x: 1280 / 2, y: 720 / 2 });
		puck.addComponent(Sprite, { imageUrl: Assets.Puck });
		puck.addComponent(PhysicsBody, {
			body: PhysicsBody.circle(40, {
				mass: 1,
				restitution: 0.9,
				inertia: Infinity,
				collisionFilter: { category: CollisionCategory.Puck, mask: CollisionCategory.Wall | CollisionCategory.Player }
			})
		});
		puck.addComponent(Puck);
		puck.add((this.score = new Score()));
		return puck;
	}

	createWalls(): Entity[] {
		const top = this.createWall(1280 / 2, 10 / 2, 1280, 10);
		const bottom = this.createWall(1280 / 2, 720 - 10 / 2, 1280, 10);
		const rightTop = this.createWall(1280 - 5, 192 / 2, 10, 192);
		const rightBottom = this.createWall(1280 - 5, 720 - 192 / 2, 10, 192);
		const leftTop = this.createWall(5, 192 / 2, 10, 192);
		const leftBottom = this.createWall(5, 720 - 192 / 2, 10, 192);

		const rightGoal = this.createGoal(1280 - 5, 192 + 336 / 2);
		const leftGoal = this.createGoal(5, 192 + 336 / 2);

		return [top, bottom, rightTop, rightBottom, leftTop, leftBottom, leftGoal, rightGoal];
	}

	createWall(x: number, y: number, width: number, height): Entity {
		const wall = new Entity();
		wall.addComponent(Position, { x, y });
		wall.addComponent(PhysicsBody, {
			body: PhysicsBody.rectangle(width, height, {
				isStatic: true,
				collisionFilter: { category: CollisionCategory.Wall, mask: CollisionCategory.Player | CollisionCategory.Puck }
			})
		});
		return wall;
	}

	createGoal(x: number, y: number): Entity {
		const goal = new Entity();
		goal.addComponent(Position, { x, y });
		goal.addComponent(PhysicsBody, {
			body: PhysicsBody.rectangle(10, 336, {
				isStatic: true,
				collisionFilter: { category: CollisionCategory.Goal, mask: CollisionCategory.Player }
			})
		});

		return goal;
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
