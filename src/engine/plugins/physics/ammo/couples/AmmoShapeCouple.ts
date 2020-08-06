import AmmoBody from '../components/AmmoBody';
import { all } from '@ecs/ecs/Query';
import { useAmmoCouple } from './AmmoCouple';
import { System } from '@ecs/ecs/System';
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
