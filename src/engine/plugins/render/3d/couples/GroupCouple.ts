import Transform from '@ecs/plugins/math/Transform';
import { all } from '@ecs/ecs/Query';
import { useThreeCouple } from './ThreeCouple';
import { Group } from 'three';
import RenderSystem from '../systems/RenderSystem';

export const useGroupCouple = (system: RenderSystem) =>
	useThreeCouple<Group>(system, all(Transform, Group), {
		onCreate: entity => {
			return entity.get(Group);
		}
	});
