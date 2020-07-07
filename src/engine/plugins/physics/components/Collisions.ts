import { Entity } from '@ecs/ecs/Entity';
import { ContactEquation } from 'cannon-es';

export default class Collisions {
	public contacts: Map<Entity, ContactEquation> = new Map();
	public collisionHandler: (event: any) => any;

	public hasCollidedWith(entity: Entity) {
		return this.contacts.has(entity);
	}
}
