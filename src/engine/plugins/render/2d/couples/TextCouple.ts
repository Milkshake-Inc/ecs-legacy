import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { Text } from 'pixi.js';
import { usePixiCouple } from './PixiCouple';

export const useTextCouple = (system: System) =>
	usePixiCouple<Text>(system, all(Transform, Text), {
		onCreate: entity => {
			return entity.get(Text);
		}
	});
