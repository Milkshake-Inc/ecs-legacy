import { System, all, any } from 'tick-knock';
import Transform from '@ecs/plugins/math/Transform';
import { useThreeCouple } from './ThreeCouple';
import { Mesh, InstancedMesh, ArrowHelper } from 'three';

export const useMeshCouple = (system: System) =>
	useThreeCouple<Mesh>(system, [all(Transform), any(Mesh, InstancedMesh)], {
		onCreate: entity => {
			if (entity.has(InstancedMesh)) {
				return entity.get(InstancedMesh);
			}

			return entity.get(Mesh);
		}
	});

export const useArrowHelperCouple = (system: System) =>
	useThreeCouple<ArrowHelper>(system, [all(Transform), any(ArrowHelper)], {
		onCreate: entity => {
			return entity.get(ArrowHelper);
		}
	});
