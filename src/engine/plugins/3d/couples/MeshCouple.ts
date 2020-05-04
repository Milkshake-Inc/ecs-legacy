import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { Mesh, InstancedMesh } from 'three';

export const useMeshCouple = (system: System) =>
	useThreeCouple<Mesh>(system, [all(Transform), any(Mesh, InstancedMesh)], {
		onCreate: entity => {
			if (entity.has(InstancedMesh)) {
				return entity.get(InstancedMesh);
			}

			return entity.get(Mesh);
		}
	});
