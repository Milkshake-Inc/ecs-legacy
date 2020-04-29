import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { Mesh } from 'three';

export const useMeshCouple = (system: System) =>
	useThreeCouple<Mesh>(system, all(Transform, Mesh), {
		onCreate: entity => {
			return entity.get(Mesh);
		}
	});
