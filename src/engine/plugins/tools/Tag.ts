import { Entity } from '@ecs/ecs/Entity';

export default class Tag {
	public static is(entity: Entity, value: string) {
		if (entity.has(Tag)) {
			return entity.get(Tag).value == value;
		}

		return false;
	}

	public value: string;

	constructor(value: string) {
		this.value = value;
	}
}
