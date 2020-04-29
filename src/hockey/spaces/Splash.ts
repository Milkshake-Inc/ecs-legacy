import { Entity } from '@ecs/ecs/Entity';
import Transform from '@ecs/plugins/Transform';
import Sprite from '@ecs/plugins/render/components/Sprite';
import Space from '@ecs/plugins/space/Space';
import { LoadPixiAssets } from '@ecs/utils/PixiHelper';
import Vector3 from '@ecs/math/Vector';

const Assets = {
	SplashBackground: 'assets/splash/background.png'
};

export default class Splash extends Space {
	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		const background = new Entity();
		background.add(Transform);
		background.add(Sprite, {
			imageUrl: Assets.SplashBackground,
			anchor: Vector3.ZERO
		});
		this.addEntity(background);
	}
}
