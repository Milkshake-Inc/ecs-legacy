import { Entity } from 'tick-knock';

export default class Collisions {
	public contacts: Set<Entity> = new Set();
	public collisionHandler: (event: any) => any;

	public hasCollidedWith(...entities: Entity[]) {
		for (const entity of entities) {
			if (this.contacts.has(entity)) return true;
		}
		return false;
	}
}
