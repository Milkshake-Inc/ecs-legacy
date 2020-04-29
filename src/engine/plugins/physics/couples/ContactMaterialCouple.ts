import { all } from '@ecs/utils/QueryHelper';
import { Transform, ContactMaterial } from 'cannon';
import { System } from '@ecs/ecs/System';
import { useCannonCouple } from './CannonCouple';

export const useContactMaterialCouple = (system: System) =>
	useCannonCouple<ContactMaterial>(system, all(Transform, ContactMaterial), {
		onCreate: entity => {
			return entity.get(ContactMaterial);
		}
	});
