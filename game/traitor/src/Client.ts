import { Entity } from '@ecs/core/Entity';
import Transform from '@ecs/plugins/math/Transform';
import Sprite from '@ecs/plugins/render/2d/components/Sprite';
import { PixiEngine } from '@ecs/plugins/render/2d/PixiEngine';
import Space from '@ecs/plugins/space/Space';
import { LoadPixiAssets } from '@ecs/plugins/tools/PixiHelper';

const Assets = {
	Background: 'assets/player.json',
};

export class ClientTraitor extends Space {
	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		const background = new Entity();
        background.add(Transform);
		background.add(Sprite, { imageUrl: 'idle-1.png' });
		this.addEntities(background);
	}
}

const engine = new PixiEngine();
new ClientTraitor(engine, true);
console.log('🎉 Client');