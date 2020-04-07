import { Entity } from '@ecs/ecs/Entity';
import Input from '@ecs/plugins/input/components/Input';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';
import Position from '@ecs/plugins/Position';
import Sprite from '@ecs/plugins/render/components/Sprite';
import Space from '@ecs/plugins/space/Space';
import { NetEngine } from '..';
import PlayerSpawnSystem from './systems/PlayerSpawnSystem';
import WorldUpdateSystem from './systems/WorldUpdateSystem';

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

const PlayerConfig = [
	{
		spawnPoint: { x: 100, y: 720 / 2 },
		asset: Assets.RedPaddle
	},
	{
		spawnPoint: { x: 1280 - 100, y: 720 / 2 },
		asset: Assets.BluePaddle
	}
];

export default class Hockey extends Space {
	private net: NetEngine;
	private connected = 0;

	constructor(net: NetEngine) {
		super(net, 'hockey');
		this.net = net;
	}

	setup() {
		this.addSystem(new PhysicsSystem({ x: 0, y: 0, scale: 0 }));
		this.addSystem(new PlayerSpawnSystem(id => this.createPaddle(id)));
		this.addSystem(new WorldUpdateSystem(this.net.connections));

		this.addEntities(this.createPuck(), ...this.createWalls());
	}

	createPaddle(id: string): Entity {
		const playerConfig = PlayerConfig[this.connected++ % 2];

		const paddle = new Entity();
		paddle.add(Position, playerConfig.spawnPoint);
		paddle.add(Sprite, { imageUrl: playerConfig.asset });
		paddle.add(Input.WASD());
		paddle.add(
			PhysicsBody.circle(65, {
				mass: 10,
				frictionAir: 0.1,
				inertia: Infinity,
				collisionFilter: { category: CollisionCategory.Player }
			})
		);

		return paddle;
	}

	createPuck(): Entity {
		const puck = new Entity();
		puck.add(Position, { x: 1280 / 2, y: 720 / 2 });
		puck.add(Sprite, { imageUrl: Assets.Puck });
		puck.add(
			PhysicsBody.circle(40, {
				mass: 1,
				restitution: 0.9,
				inertia: Infinity,
				collisionFilter: { category: CollisionCategory.Puck, mask: CollisionCategory.Wall | CollisionCategory.Player }
			})
		);
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
		wall.add(Position, { x, y });
		wall.add(
			PhysicsBody.rectangle(width, height, {
				isStatic: true,
				collisionFilter: { category: CollisionCategory.Wall, mask: CollisionCategory.Player | CollisionCategory.Puck }
			})
		);
		// wall.add(Wall);
		return wall;
	}

	createGoal(x: number, y: number): Entity {
		const goal = new Entity();
		goal.add(Position, { x, y });
		goal.add(
			PhysicsBody.rectangle(10, 336, {
				isStatic: true,
				collisionFilter: { category: CollisionCategory.Goal, mask: CollisionCategory.Player }
			})
		);

		return goal;
	}
}
