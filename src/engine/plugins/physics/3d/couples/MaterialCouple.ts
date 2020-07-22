import { all } from '@ecs/ecs/Query';
import { Transform, Material } from 'cannon-es';
import { System } from '@ecs/ecs/System';
import { useCannonCouple } from './CannonCouple';

export const useMaterialCouple = (system: System) =>
	useCannonCouple<Material>(system, all(Transform, Material), {
		onCreate: entity => {
			return entity.get(Material);
		}
	});
