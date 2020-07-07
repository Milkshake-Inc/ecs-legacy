import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { useCannonCouple } from './CannonCouple';
import { Body, ContactEquation } from 'cannon-es';
import CannonBody from '../components/CannonBody';
import Collisions from '../components/Collisions';
import { Entity } from '@ecs/ecs/Entity';

type CollisionEvent = {
	body: Body;
	contact: ContactEquation;
};

const bodyToEntity = new Map<Body, Entity>();

export const useBodyCouple = (system: System) =>
	useCannonCouple<Body>(system, [all(Transform), any(Body, CannonBody)], {
		onCreate: entity => {
			const transform = entity.get(Transform);
			const body = entity.get(CannonBody) || entity.get(Body);

			body.position.set(transform.x, transform.y, transform.z);
			body.quaternion.set(transform.qx, transform.qy, transform.qz, transform.qw);

			// Handle collisions
			bodyToEntity.set(body, entity);
			const collisions = new Collisions();
			collisions.collisionHandler = (event: CollisionEvent) => {
				const collisions = entity.get(Collisions);
				const other = bodyToEntity.get(event.body);

				collisions.contacts.set(other, event.contact);
			};

			entity.add(Collisions);
			body.addEventListener(Body.COLLIDE_EVENT_NAME, collisions.collisionHandler);

			return body;
		},
		onUpdate: (entity, body, dt) => {
			const transform = entity.get(Transform);
			const cannonBody = entity.get(CannonBody);

			let pos = body.position;
			let rot = body.quaternion;

			if (cannonBody && cannonBody.interpolation) {
				pos = body.interpolatedPosition;
				rot = body.interpolatedQuaternion;
			}

			transform.position.set(pos.x, pos.y, pos.z);
			transform.quaternion.set(rot.x, rot.y, rot.z, rot.w);

			if (cannonBody && cannonBody.offset) {
				transform.position = transform.position.add(cannonBody.offset);
			}
		},
		onLateUpdate: (entity, body, dt) => {
			// Clear all old collisions
			entity.get(Collisions).contacts.clear();
		},
		onDestroy: entity => {
			const body = entity.get(Body);
			bodyToEntity.delete(body);
			body.removeEventListener(Body.COLLIDE_EVENT_NAME, entity.get(Collisions).collisionHandler);
		}
	});
