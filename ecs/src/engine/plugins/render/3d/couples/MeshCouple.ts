import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { all, any } from '@ecs/core/Query';
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
