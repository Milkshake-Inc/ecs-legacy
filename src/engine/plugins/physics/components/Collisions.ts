import { Entity } from '@ecs/ecs/Entity';
import { ContactEquation } from 'cannon-es';

export default class Collisions {
	public contacts: Map<Entity, ContactEquation> = new Map();
	public collisionHandler: (event: any) => any;

	public hasCollidedWith(...entities: Entity[]) {
		for (const entity of entities) {
			if (this.contacts.has(entity)) return true;
		}
		return false;
	}
}
