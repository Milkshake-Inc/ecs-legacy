import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { Sprite } from 'pixi.js';
import { usePixiCouple } from './PixiCouple';

export const useSpriteCouple = (system: System) =>
	usePixiCouple<Sprite>(system, all(Transform, Sprite), {
		onCreate: entity => {
			return entity.get(Sprite);
		}
	});
