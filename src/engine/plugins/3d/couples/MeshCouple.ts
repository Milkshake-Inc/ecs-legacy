import { System } from '@ecs/ecs/System';
import Position from '@ecs/plugins/Position';
import { all } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { Mesh } from 'three';

export const useMeshCouple = (system: System) =>
	useThreeCouple<Mesh>(system, all(Position, Mesh), {
		onCreate: entity => {
			return entity.get(Mesh);
		}
	});
