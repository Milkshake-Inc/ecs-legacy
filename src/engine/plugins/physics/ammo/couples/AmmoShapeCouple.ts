import AmmoBody from '../components/AmmoBody';
import { all, System } from 'tick-knock';
import { useAmmoCouple } from './AmmoCouple';
import AmmoShape from '../components/AmmoShape';

export const useAmmoShapeCouple = (system: System) =>
	useAmmoCouple(system, all(AmmoBody, AmmoShape), {
		onCreate: entity => {
			const { shape } = entity.get(AmmoShape);
			const body = entity.get(AmmoBody);

			body.shape = shape;

			return shape;
		}
	});
