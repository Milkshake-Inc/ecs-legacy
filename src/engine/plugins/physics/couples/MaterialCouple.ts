import { all } from '@ecs/utils/QueryHelper';
import { Transform, Material } from 'cannon';
import { System } from '@ecs/ecs/System';
import { useCannonCouple } from './CannonCouple';

export const useMaterialCouple = (system: System) =>
	useCannonCouple<Material>(system, all(Transform, Material), {
		onCreate: entity => {
			return entity.get(Material);
		}
	});
