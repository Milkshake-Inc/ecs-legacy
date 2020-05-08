import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { useCannonCouple } from './CannonCouple';
import { Body } from 'cannon-es';
import CannonBody from '../components/CannonBody';

export const useBodyCouple = (system: System) =>
	useCannonCouple<Body>(system, [all(Transform), any(Body, CannonBody)], {
		onCreate: entity => {
			const transform = entity.get(Transform);
			const body = entity.get(CannonBody) || entity.get(Body);

			body.position.set(transform.x, transform.y, transform.z);
			body.quaternion.set(transform.qx, transform.qy, transform.qz, transform.qw);

			return body;
		},
		onUpdate: (entity, body, dt) => {
			const transform = entity.get(Transform);
			const cannonBody = entity.get(CannonBody);

			let pos = body.position;
			let rot = body.quaternion;

			if (cannonBody && cannonBody.interpolation) {
				console.log(`${pos.z} ${body.interpolatedPosition.z}`);
				pos = body.interpolatedPosition;
				rot = body.interpolatedQuaternion;
			}

			transform.position.set(pos.x, pos.y, pos.z);
			transform.quaternion.set(rot.x, rot.y, rot.z, rot.w);

			if (cannonBody && cannonBody.offset) {
				transform.position = transform.position.add(cannonBody.offset);
			}
		}
	});
