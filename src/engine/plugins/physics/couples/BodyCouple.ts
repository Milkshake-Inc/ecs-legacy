import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { useCannonCouple } from './CannonCouple';
import { Body } from 'cannon';

export const useBodyCouple = (system: System) =>
	useCannonCouple<Body>(system, all(Transform, Body), {
		onCreate: entity => {
			const transform = entity.get(Transform);
			const body = entity.get(Body);
			body.position.set(transform.x, transform.y, transform.z);
			body.quaternion.set(transform.qx, transform.qy, transform.qz, transform.qw);

			return body;
		},
		onUpdate: (entity, body, dt) => {
			const transform = entity.get(Transform);

			transform.position.set(body.position.x, body.position.y, body.position.z);
			transform.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
		}
	});
