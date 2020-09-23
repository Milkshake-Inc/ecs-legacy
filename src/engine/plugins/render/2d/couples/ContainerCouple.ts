import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { Container } from 'pixi.js';
import { usePixiCouple } from './PixiCouple';

export const useContainerCouple = (system: System) =>
	usePixiCouple<Container>(system, all(Transform, Container), {
		onCreate: entity => {
			return entity.get(Container);
		}
	});
