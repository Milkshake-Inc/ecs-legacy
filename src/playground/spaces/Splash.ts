import { Entity } from '@ecs/ecs/Entity';
import Position from '@ecs/plugins/Position';
import Sprite from '@ecs/plugins/render/components/Sprite';
import Space from '@ecs/plugins/space/Space';
import { LoadPixiAssets } from '@ecs/utils/PixiHelper';
import Vector2 from '@ecs/math/Vector2';

const Assets = {
	SplashBackground: 'assets/splash/background.png',
};

export default class Splash extends Space {
	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		const background = new Entity();
		background.add(Position);
		background.add(Sprite, {
			imageUrl: Assets.SplashBackground,
			anchor: Vector2.ZERO,
		});
		this.addEntity(background);
	}
}
