import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Vector2 from '@ecs/math/Vector2';
import Input from '@ecs/plugins/input/components/Input';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Position from '@ecs/plugins/Position';
import Sprite from '@ecs/plugins/render/components/Sprite';
import BoundingCircle from './components/BoundingCircle';
import Moveable from './components/Moveable';
import Physics from './components/Physics';
import BoundsSystem from './systems/BoundsSystem';
import MovementSystem from './systems/MovementSystem';
import PhysicsSystem from './systems/PhysicsSystem';

export const generateHockey = (engine: Engine) => {
	engine.addSystem(new InputSystem());
	engine.addSystem(new MovementSystem());
	engine.addSystem(new PhysicsSystem());
	engine.addSystem(new BoundsSystem({ width: 1280, height: 720 }));

	const background = new Entity();
	background.addComponent(Position);
	background.addComponent(Sprite, { imageUrl: 'assets/hockey/background.png', anchor: Vector2.ZERO });

	const paddle = new Entity();
	paddle.addComponent(Position);
	paddle.addComponent(Sprite, { imageUrl: 'assets/hockey/red.png' });
	paddle.addComponent(Input);
	paddle.addComponent(Moveable, { speed: 0.4 });
	paddle.addComponent(Physics);
    paddle.addComponent(BoundingCircle, { size: 130 });


    const puck = new Entity();
	puck.addComponent(Position, { x: 1280 / 2, y: 720 / 2 });
	puck.addComponent(Sprite, { imageUrl: 'assets/hockey/puck.png' });
	puck.addComponent(Physics, { velocity: Vector2.EQUAL(0.4), bounce: true });
	puck.addComponent(BoundingCircle, { size: 80 });

	engine.addEntities(background, paddle, puck);
};

