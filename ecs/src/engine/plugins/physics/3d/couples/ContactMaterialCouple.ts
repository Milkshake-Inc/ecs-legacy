import { all } from '@ecs/core/Query';
import { Transform, ContactMaterial } from 'cannon-es';
import { System } from '@ecs/core/System';
import { useCannonCouple } from './CannonCouple';

export const useContactMaterialCouple = (system: System) =>
	useCannonCouple<ContactMaterial>(system, all(Transform, ContactMaterial), {
		onCreate: entity => {
			return entity.get(ContactMaterial);
		}
	});
