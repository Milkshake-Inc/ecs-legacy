import { System, all } from 'tick-knock';
import { Transform, ContactMaterial } from 'cannon-es';
import { useCannonCouple } from './CannonCouple';

export const useContactMaterialCouple = (system: System) =>
	useCannonCouple<ContactMaterial>(system, all(Transform, ContactMaterial), {
		onCreate: entity => {
			return entity.get(ContactMaterial);
		}
	});
