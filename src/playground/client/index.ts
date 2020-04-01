import { Entity } from '@ecs/ecs/Entity';
import Vector2 from '@ecs/math/Vector2';
import Position from '@ecs/plugins/Position';
import Sprite from '@ecs/plugins/render/components/Sprite';
import RenderSystem from '@ecs/plugins/render/systems/RenderSystem';
import TickerEngine from '@ecs/TickerEngine';
import { Loader } from 'pixi.js';

const Assets = {
	Stars: 'assets/placeholder/stars.png',
	Moon: 'assets/placeholder/moon.png',
	World: 'assets/placeholder/world.png'
};

class PixiEngine extends TickerEngine {
	protected loader: Loader;
	constructor(content: { [index: string]: string } = {}, tickRate: number = 60) {
		super(tickRate);

		this.addSystem(new RenderSystem());

		this.loader = Loader.shared;

		try {
			this.loader.add(Object.values(content));
		} catch (e) {
			console.warn(e);
		}

		this.preload().then(() => {
			this.setup();
		});
	}

	protected async preload() {
		return new Promise(resolve => {
			this.loader.load(resolve);
		});
	}

	protected setup() {}

	protected getTime(): number {
		return performance.now();
	}
}

class PlaygroundEngine extends PixiEngine {
	constructor() {
		super(Assets, 60);
	}

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

new PlaygroundEngine();

console.log('🎉 Client');
