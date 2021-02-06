import { all, System } from 'tick-knock';
import { Transform, Material } from 'cannon-es';
import { useCannonCouple } from './CannonCouple';

export const useMaterialCouple = (system: System) =>
	useCannonCouple<Material>(system, all(Transform, Material), {
		onCreate: entity => {
			return entity.get(Material);
		}
	});
