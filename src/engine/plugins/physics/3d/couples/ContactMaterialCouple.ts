import { all } from '@ecs/ecs/Query';
import { Transform, ContactMaterial } from 'cannon-es';
import { System } from '@ecs/ecs/System';
import { useCannonCouple } from './CannonCouple';

export const useContactMaterialCouple = (system: System) =>
	useCannonCouple<ContactMaterial>(system, all(Transform, ContactMaterial), {
		onCreate: entity => {
			return entity.get(ContactMaterial);
		}
	});
