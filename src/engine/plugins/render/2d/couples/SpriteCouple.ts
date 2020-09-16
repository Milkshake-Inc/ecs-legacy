import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { all } from '@ecs/core/Query';
import { BaseTexture, resources, Sprite as PixiSprite, Texture } from 'pixi.js';
import Sprite from '../components/Sprite';
import { usePixiCouple } from './PixiCouple';

export const useSpriteCouple = (system: System) =>
	usePixiCouple<PixiSprite>(system, all(Transform, Sprite), {
		onCreate: entity => {
			const { imageUrl, frame } = entity.get(Sprite);
			return PixiSprite.from(imageUrl);
		},
		onUpdate: (entity, displayObject) => {
			const sprite = entity.get(Sprite);

			if (sprite.frame && displayObject.texture.baseTexture.resource.valid) {
				displayObject.texture.frame = sprite.frame;
			}

			if (sprite.imageUrl && (displayObject.texture.baseTexture.resource as resources.ImageResource).url) {
				displayObject.texture = Texture.from(sprite.imageUrl);
			}

			displayObject.tint = sprite.tint;
			displayObject.anchor.set(sprite.anchor.x, sprite.anchor.y);
		}
	});
