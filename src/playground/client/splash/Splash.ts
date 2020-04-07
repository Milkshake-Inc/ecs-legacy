import Space from '@ecs/plugins/space/Space';
import Position from '@ecs/plugins/Position';
import { Entity } from '@ecs/ecs/Entity';
import Vector2 from '@ecs/math/Vector2';
import Sprite from '@ecs/plugins/render/components/Sprite';
import { LoadPixiAssets } from '@ecs/utils/PixiHelper';

const Assets = {
	Stars: 'assets/splash/stars.png',
	Moon: 'assets/splash/moon.png',
	World: 'assets/splash/world.png'
};

export default class Splash extends Space {
	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		const background = new Entity();
		background.add(Position);
		background.add(Sprite, {
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
