import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { all } from '@ecs/core/Query';
import { Graphics } from 'pixi.js';
import { usePixiCouple } from './PixiCouple';

export const useGraphicsCouple = (system: System) =>
	usePixiCouple<Graphics>(system, all(Transform, Graphics), {
		onCreate: entity => {
			return entity.get(Graphics);
		}
	});
