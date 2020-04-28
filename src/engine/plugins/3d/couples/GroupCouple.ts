import Position from '@ecs/plugins/Position';
import { all } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { Group } from 'three';
import RenderSystem from '../systems/RenderSystem';

export const useGroupCouple = (system: RenderSystem) =>
	useThreeCouple<Group>(system, all(Position, Group), {
		onCreate: entity => {
			return entity.get(Group);
		}
	});
