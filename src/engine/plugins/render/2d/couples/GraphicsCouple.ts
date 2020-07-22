import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/math/Transform';
import { all } from '@ecs/ecs/Query';
import { Graphics } from 'pixi.js';
import { usePixiCouple } from './PixiCouple';

export const useGraphicsCouple = (system: System) =>
	usePixiCouple<Graphics>(system, all(Transform, Graphics), {
		onCreate: entity => {
			return entity.get(Graphics);
		}
	});
