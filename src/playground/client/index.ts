import { Entity } from '@ecs/ecs/Entity';
import Vector2 from '@ecs/math/Vector2';
import Position from '@ecs/plugins/Position';
import Sprite from '@ecs/plugins/render/components/Sprite';
import RenderSystem from '@ecs/plugins/render/systems/RenderSystem';
import TickerEngine from '@ecs/TickerEngine';
import Space from '@ecs/plugins/space/Space';
import Hockey from './hockey/Hockey';

const Assets = {
	Stars: 'assets/placeholder/stars.png',
	Moon: 'assets/placeholder/moon.png',
	World: 'assets/placeholder/world.png',
	Egg: 'assets/pong/egg.png',
	Pong: 'assets/pong/lobby.png',
	Ra: 'assets/pong/ra.png'
};

class PixiEngine extends TickerEngine {
	protected spaces: Map<string, Space>;

	constructor(tickRate = 60) {
		super(tickRate);

		this.addSystem(new RenderSystem());

		this.spaces = new Map();
	}

	public getSpace(spaceName: string) {
		return this.spaces.get(spaceName);
	}

	public registerSpaces(...spaces: Space[]) {
		spaces.forEach(v => this.spaces.set(v.name, v));
	}

	protected getTime(): number {
		return performance.now();
	}
}

class MainMenu extends Space {
	setup() {
		const background = new Entity();
		background.addComponent(Position);
		background.addComponent(Sprite, {
			imageUrl: Assets.Stars,
			anchor: Vector2.ZERO
		});
		this.addEntity(background);

		const moon = new Entity();
		moon.add(new Position(200, 180));
		moon.add(new Sprite(Assets.Moon));
		this.addEntity(moon);

		const earth = new Entity();
		earth.add(new Position(1280 / 2, 1000));
		earth.add(new Sprite(Assets.World));
		this.addEntity(earth);
	}
}

const engine = new PixiEngine();
engine.registerSpaces(new MainMenu(engine, 'mainMenu'), new Hockey(engine, 'hockey'));

engine.getSpace('mainMenu').open();

setTimeout(() => {
	engine.getSpace('mainMenu').close();
	engine.getSpace('hockey').open();
}, 2000);
console.log('🎉 Client');
