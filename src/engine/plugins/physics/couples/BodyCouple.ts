import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { useCannonCouple } from './CannonCouple';
import { Body, Vec3 } from 'cannon';

const euler = new Vec3();

export const useBodyCouple = (system: System) =>
	useCannonCouple<Body>(system, all(Transform, Body), {
		onCreate: entity => {
			const transform = entity.get(Transform);
			const body = entity.get(Body);
			body.position.x = transform.x;
			body.position.y = transform.y;
			body.position.z = transform.z;
			body.quaternion.setFromEuler(transform.rx, transform.ry, transform.rz);

			return body;
		},
		onUpdate: (entity, body, dt) => {
			const transform = entity.get(Transform);

			transform.x = body.position.x;
			transform.y = body.position.y;
			transform.z = body.position.z;

			// TODO use quaternians for all rotation
			body.quaternion.toEuler(euler);
			transform.rx = euler.x;
			transform.ry = euler.y;
			transform.rz = euler.z;
		}
	});
